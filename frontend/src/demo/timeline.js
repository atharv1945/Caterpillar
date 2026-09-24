import { bob_captions, shift_summary } from "../mockData";
import { getValueOrFallback } from "../utils/getValueOrFallback";

// One continuous, elapsed-seconds-driven shift timeline replaces the old
// discrete presenter scenes. `elapsed` only ticks forward while nothing is
// waiting on the operator (idle sheet / critical alert / chat open), so the
// same milestones always land in the same order regardless of how long a
// prompt sits open.

export const IDLE_TRIGGER_T = 18; // idle starts accumulating
export const IDLE_THRESHOLD_T = 26; // 5 sim-minutes of idle reached -> Bob asks
export const WEATHER_T = 30; // rain moves in shortly after idle is resolved
export const SAFETY_T = 58; // seatbelt/proximity event
export const COMPLETE_T = 90; // task finishes

// Fallback-only: fires the auto-nav to Training if the operator hasn't
// started Task 2 by then. Must stay after TASK2_READY_DELAY_T (10s) so the
// "Ready to start" card has a real window to be seen and tapped on Home
// before Training sweeps the screen away.
export const TRAINING_AUTO_NAV_DELAY_MS = 14000;
export const TRAINING_DISPLAY_MS = 16000;

// How long the mid-shift behavior-insight caption holds before yielding back
// to the normal cascade (weather/ack/etc). A fixed real-time window, not tied
// to `elapsed`, so it's always visible for the same duration regardless of
// exactly when the operator acknowledges the idle prompt.
export const BEHAVIOR_INSIGHT_DISPLAY_MS = 4000;
export const MID_SHIFT_INSIGHT_FALLBACK =
  "That idle stretch was a bit longer than usual — worth keeping an eye on.";

// Every "this looks like it came from a model" number here is wrapped in
// getValueOrFallback — the model outputs are null stand-ins for a teammate's
// not-yet-wired ETA/behavior model; the fallback is what plays live tonight.
const ML_ETA_MODEL_OUTPUT = null;
const ML_BEHAVIOR_INSIGHT = null;

// Piecewise-linear keyframes for the numbers that should visibly move on
// their own. Interpolated by `elapsed`, clamped at both ends.
const KEYFRAMES = [
  { t: 0, progress: 8, eta: 58, cycles: 6 },
  { t: IDLE_TRIGGER_T, progress: 25, eta: 52, cycles: 18 },
  { t: IDLE_THRESHOLD_T, progress: 25, eta: 52, cycles: 18 }, // flat while idle sheet is up
  { t: WEATHER_T + 4, progress: 28, eta: 58, cycles: 21 }, // resumed + rain bump
  { t: SAFETY_T, progress: 40, eta: 46, cycles: 34 },
  { t: COMPLETE_T, progress: 100, eta: 0, cycles: 49 },
];

function interpolate(elapsed, key, keyframes = KEYFRAMES) {
  const t = Math.max(0, elapsed);
  if (t <= keyframes[0].t) return keyframes[0][key];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const ratio = span === 0 ? 1 : (t - a.t) / span;
      return a[key] + (b[key] - a[key]) * ratio;
    }
  }
  return keyframes[keyframes.length - 1][key];
}

function idleMinutesAt(elapsed) {
  if (elapsed < IDLE_TRIGGER_T) return 0;
  if (elapsed >= IDLE_THRESHOLD_T) return 5;
  const ratio = (elapsed - IDLE_TRIGGER_T) / (IDLE_THRESHOLD_T - IDLE_TRIGGER_T);
  return Math.round(ratio * 5);
}

// The "live" telemetry snapshot for the current elapsed second — this is
// what both Home and Task Detail read, so neither one ever shows numbers
// that disagree with the other.
export function getLiveTaskSnapshot(elapsed) {
  const progress = Math.round(getValueOrFallback(interpolate(elapsed, "progress"), 8, { min: 0, max: 100 }));
  const rawEta = getValueOrFallback(ML_ETA_MODEL_OUTPUT, interpolate(elapsed, "eta"), { min: 0, max: 480 });
  const eta = Math.round(rawEta);
  const cycles = Math.round(interpolate(elapsed, "cycles"));
  const idleMin = idleMinutesAt(elapsed);
  const isRaining = elapsed >= WEATHER_T;

  return {
    progress_pct: progress,
    eta_min: eta,
    load_cycles: cycles,
    idling_time_min: idleMin,
    weather_condition: isRaining ? "Rain" : "Clear",
    ground_condition: isRaining ? "Muddy" : "Dry",
    why: isRaining
      ? "Rain since 9:00 AM softened the topsoil in Zone A, so each dig cycle now takes longer."
      : "Based on your current dig rate and this morning's dry ground conditions.",
  };
}

// Caption + Bob state cascade — checked most-advanced-condition-first so it
// always reflects the latest relevant beat without tracking caption history.
export function getLiveCaption({ screen, elapsed, idleOpen, idleAcked, idleReasonCode, criticalOpen, criticalAcked }) {
  if (screen === "resume") return { caption: "Nice work today.", bobState: "coaching" };
  if (screen === "training") {
    return { caption: "Here's a quick refresher based on today's ground conditions.", bobState: "coaching" };
  }
  if (elapsed >= COMPLETE_T) {
    return { caption: getValueOrFallback(ML_BEHAVIOR_INSIGHT, shift_summary.behavior_insight), bobState: "coaching" };
  }
  if (criticalOpen) return { caption: bob_captions.critical, bobState: "critical" };
  if (criticalAcked) {
    return { caption: "Incident logged and summarized for your safety officer.", bobState: "coaching" };
  }
  // Warning (not coaching) for this beat specifically — a real "conditions
  // changed, pay attention" moment, distinct from the positive/coaching tint
  // used once things are actually resolved.
  if (elapsed >= WEATHER_T) return { caption: bob_captions.etaChange, bobState: "warning" };
  if (idleOpen) return { caption: bob_captions.idle, bobState: "listening" };
  if (idleAcked) {
    return { caption: IDLE_REASON_ACK_CAPTIONS[idleReasonCode] ?? bob_captions.idleAck, bobState: "normal" };
  }
  return { caption: bob_captions.taskStart, bobState: "normal" };
}

// One line per reason chip so the confirmation actually reflects what the
// operator tapped, instead of a single hardcoded sentence regardless of
// choice. Falls back to the original generic line for an unrecognized code
// (e.g. the auto-timeout path, which resolves with no explicit selection).
export const IDLE_REASON_ACK_CAPTIONS = {
  WAITING_TRUCK: "Logged — waiting on the truck.",
  WAITING_INSTRUCTIONS: "Logged — waiting on instructions.",
  MECHANICAL_ISSUE: "Logged — mechanical issue noted.",
  WEATHER: "Logged — weather or site conditions noted.",
  BREAK: "Logged — scheduled break noted.",
  OTHER: "Logged — noted, thanks for letting me know.",
};

export const RECOVERY_MILESTONES = [IDLE_THRESHOLD_T, WEATHER_T, SAFETY_T, COMPLETE_T];

// ── Task 2 (Trench Backfill) — a second, deliberately simpler live cycle ──
// Starts only after the operator taps the "Ready to start" card, so it runs
// on its own elapsed-since-start baseline rather than the shift's main
// `elapsed` origin. No idle/critical/weather beats — just a basic
// progress/ETA curve, since this only needs to demonstrate a second task
// going live, not the full richness of task 1.
export const TASK2_READY_DELAY_T = 10; // seconds after task 1 completes
export const TASK2_COMPLETE_T = 45;

const TASK2_KEYFRAMES = [
  { t: 0, progress: 0, eta: 40, cycles: 0 },
  { t: TASK2_COMPLETE_T, progress: 100, eta: 0, cycles: 22 },
];

export function getTask2Snapshot(task2Elapsed) {
  const progress = Math.round(
    getValueOrFallback(interpolate(task2Elapsed, "progress", TASK2_KEYFRAMES), 0, { min: 0, max: 100 })
  );
  const eta = Math.round(
    getValueOrFallback(interpolate(task2Elapsed, "eta", TASK2_KEYFRAMES), 40, { min: 0, max: 200 })
  );
  const cycles = Math.round(interpolate(task2Elapsed, "cycles", TASK2_KEYFRAMES));

  return {
    progress_pct: progress,
    eta_min: eta,
    load_cycles: cycles,
    idling_time_min: 0,
    weather_condition: "Clear",
    ground_condition: "Dry",
    why: "Standard backfill pace for Zone B.",
  };
}
