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

export const IDLE_AUTO_RESOLVE_MS = 5000;
export const CRITICAL_AUTO_RESOLVE_MS = 4000;
export const POST_COMPLETE_DELAY_MS = 8000;
export const TRAINING_DISPLAY_MS = 16000;

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

function interpolate(elapsed, key) {
  const t = Math.max(0, elapsed);
  if (t <= KEYFRAMES[0].t) return KEYFRAMES[0][key];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const ratio = span === 0 ? 1 : (t - a.t) / span;
      return a[key] + (b[key] - a[key]) * ratio;
    }
  }
  return KEYFRAMES[KEYFRAMES.length - 1][key];
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
export function getLiveCaption({ screen, elapsed, idleOpen, idleAcked, criticalOpen, criticalAcked }) {
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
  if (elapsed >= WEATHER_T) return { caption: bob_captions.etaChange, bobState: "coaching" };
  if (idleOpen) return { caption: bob_captions.idle, bobState: "listening" };
  if (idleAcked) return { caption: bob_captions.idleAck, bobState: "normal" };
  return { caption: bob_captions.taskStart, bobState: "normal" };
}

export const RECOVERY_MILESTONES = [IDLE_THRESHOLD_T, WEATHER_T, SAFETY_T, COMPLETE_T];
