import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  getLiveTaskSnapshot,
  getLiveCaption,
  IDLE_THRESHOLD_T,
  SAFETY_T,
  COMPLETE_T,
  IDLE_AUTO_RESOLVE_MS,
  CRITICAL_AUTO_RESOLVE_MS,
  POST_COMPLETE_DELAY_MS,
  TRAINING_DISPLAY_MS,
  RECOVERY_MILESTONES,
} from "./timeline";
import { tasks, bob_captions } from "../mockData";
import IntroSequence from "./IntroSequence";
import BottomRightBob from "../components/BottomRightBob";
import ChatOverlay from "../components/ChatOverlay";
import Icon from "../components/Icon";
import Home from "../screens/Home";
import TaskDetail from "../screens/TaskDetail";
import TrainingHub from "../screens/TrainingHub";
import ResumeHandover from "../screens/ResumeHandover";
import CriticalAlert from "../screens/CriticalAlert";
import IdleReasonPicker from "../screens/IdleReasonPicker";
import { playListeningChime, playCriticalAlert } from "../utils/sound";
import { api } from "../utils/api";
import { getValueOrFallback } from "../utils/getValueOrFallback";

const BASE_TASK = tasks.find((t) => t.status === "NOW");

// The backend's demo data is only wired up for TSK001 (ml_bridge, scene_state,
// and the golden telemetry rows all hardcode it as "the" live task) — even
// though /tasks/dashboard's own "now" task is TSK002. We key every backend
// call to TSK001 to match everything else the backend assumes.
const BACKEND_TASK_ID = "TSK001";
// Likewise, the seed data only has one safety event to acknowledge against.
const BACKEND_SAFETY_EVENT_ID = "SE001";

// Frontend reason chips use their own short codes; the backend's
// IdleReasonIn schema expects a different Literal vocabulary. Mapped here so
// nothing else in the UI needs to know about the backend's naming.
const IDLE_REASON_TO_BACKEND = {
  WAITING_TRUCK: "waiting_truck_material",
  WAITING_INSTRUCTIONS: "waiting_instructions",
  MECHANICAL_ISSUE: "mechanical_issue",
  WEATHER: "weather_site_condition",
  BREAK: "scheduled_break",
  OTHER: "other",
};

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Replaces the old presenter-driven scene stepper. Instead of a manually
// advanced index, an internal clock ticks the shift forward on its own —
// idle detection, weather/ETA recalculation, and the safety event all fire
// themselves when the timeline reaches them, the way a real running system
// would, rather than waiting on a "Next" click. No scene counter anywhere in
// the normal UI; a hidden dev shortcut (triple-tap top-left, or Ctrl+→ /
// Ctrl+←) is the only manual override, purely for live recovery.
export default function LiveController() {
  const [phase, setPhase] = useState("intro"); // "intro" | "live"
  const [currentScreen, setCurrentScreen] = useState("home"); // home | task | training | resume
  const [elapsed, setElapsed] = useState(0);
  const [idleOverlayOpen, setIdleOverlayOpen] = useState(false);
  const [idleAcked, setIdleAcked] = useState(false);
  const [idleReasonCode, setIdleReasonCode] = useState(null);
  const [criticalOverlayOpen, setCriticalOverlayOpen] = useState(false);
  const [criticalAcked, setCriticalAcked] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Real backend data, layered over the local timeline.js computation via
  // getValueOrFallback — null means "no good backend answer yet," which
  // falls straight through to the existing local/hardcoded value. Nothing
  // here ever blocks rendering; every fetch is fire-and-forget.
  const [backendEta, setBackendEta] = useState(null);
  const [backendBehaviorMessage, setBackendBehaviorMessage] = useState(null);
  const [backendIdleDuration, setBackendIdleDuration] = useState(null);
  const [backendSafety, setBackendSafety] = useState(null);
  const [backendBriefing, setBackendBriefing] = useState(null);
  const backendIdleEventIdRef = useRef(null);

  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = idleOverlayOpen || criticalOverlayOpen || chatOpen;
  }, [idleOverlayOpen, criticalOverlayOpen, chatOpen]);

  // The clock — ticks once per real second while nothing is waiting on the
  // operator. Reads pause state from a ref so the interval never needs to be
  // torn down/recreated on every overlay toggle.
  useEffect(() => {
    if (phase !== "live") return;
    const id = setInterval(() => {
      if (!pausedRef.current) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Live ETA — polled once per second (same cadence as the clock tick),
  // paused whenever the clock itself is paused so a chat/overlay doesn't
  // keep firing wasted requests. A stale/slow response is dropped via the
  // request-id guard so it can never overwrite a newer one.
  useEffect(() => {
    if (phase !== "live") return;
    let cancelled = false;
    let requestId = 0;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const myRequestId = ++requestId;
      api.getEta(BACKEND_TASK_ID).then((res) => {
        if (cancelled || myRequestId !== requestId) return;
        setBackendEta(res?.eta_minutes ?? null);
      });
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase]);

  // Idle detection fires itself the moment the threshold is crossed.
  useEffect(() => {
    if (elapsed >= IDLE_THRESHOLD_T && !idleAcked && !idleOverlayOpen) {
      setIdleOverlayOpen(true);
      playListeningChime();
    }
  }, [elapsed, idleAcked, idleOverlayOpen]);

  // Real idle-event data, fetched once when the sheet opens. Also stashes the
  // event id in a ref (not state — it's only ever read inside resolveIdle's
  // fire-and-forget POST, so it doesn't need to trigger a re-render or sit
  // in resolveIdle's own dependency list) so the reason we log back can
  // target the real event instead of a hardcoded id.
  useEffect(() => {
    if (!idleOverlayOpen) return;
    let cancelled = false;
    api.getActiveIdleEvent(BACKEND_TASK_ID).then((res) => {
      if (cancelled) return;
      setBackendIdleDuration(res?.duration_min ?? null);
      backendIdleEventIdRef.current = res?.idle_event_id ?? null;
    });
    return () => {
      cancelled = true;
    };
  }, [idleOverlayOpen]);

  // Safety event fires itself the moment its threshold is crossed.
  useEffect(() => {
    if (elapsed >= SAFETY_T && !criticalAcked && !criticalOverlayOpen) {
      setCriticalOverlayOpen(true);
      playCriticalAlert();
    }
  }, [elapsed, criticalAcked, criticalOverlayOpen]);

  // Real safety-check data, fetched once when the alert opens.
  useEffect(() => {
    if (!criticalOverlayOpen) return;
    let cancelled = false;
    api.checkSafety(BACKEND_TASK_ID).then((res) => {
      if (!cancelled) setBackendSafety(res);
    });
    return () => {
      cancelled = true;
    };
  }, [criticalOverlayOpen]);

  // Accepts the reason code the operator actually tapped (IdleReasonPicker
  // passes it through via onSubmit(selected)). The auto-timeout path calls
  // this with no argument, so it defaults to the same reason the old
  // hardcoded copy always claimed — a real answer, when there is one, and a
  // sane default when the operator didn't answer in time.
  const resolveIdle = useCallback((reasonCode) => {
    const code = reasonCode ?? "WAITING_TRUCK";
    setIdleAcked(true);
    setIdleOverlayOpen(false);
    setIdleReasonCode(code);
    const backendEventId = backendIdleEventIdRef.current;
    const backendReasonCode = IDLE_REASON_TO_BACKEND[code];
    if (backendEventId && backendReasonCode) {
      api.postIdleReason(backendEventId, backendReasonCode);
    }
  }, []);

  const resolveCritical = useCallback(() => {
    setCriticalAcked(true);
    setCriticalOverlayOpen(false);
    api.logIncident(BACKEND_SAFETY_EVENT_ID, "Operator confirmed seatbelt fastened.");
  }, []);

  // A real operator might not tap in time — auto-resolve so the shift keeps
  // moving, same safety-net spirit as the getValueOrFallback numbers.
  useEffect(() => {
    if (!idleOverlayOpen) return;
    const t = setTimeout(resolveIdle, IDLE_AUTO_RESOLVE_MS);
    return () => clearTimeout(t);
  }, [idleOverlayOpen, resolveIdle]);

  useEffect(() => {
    if (!criticalOverlayOpen) return;
    const t = setTimeout(resolveCritical, CRITICAL_AUTO_RESOLVE_MS);
    return () => clearTimeout(t);
  }, [criticalOverlayOpen, resolveCritical]);

  // Task completion → training → handover, each a timed hand-off rather
  // than a manual click, framed as "the shift moving itself forward."
  // Keyed on the derived boolean (not `elapsed` itself, which changes every
  // second) — otherwise the timeout's cleanup fires on the very next tick
  // and cancels it before the delay ever elapses.
  const isComplete = elapsed >= COMPLETE_T;
  useEffect(() => {
    if (!isComplete) return;
    const t = setTimeout(() => setCurrentScreen("training"), POST_COMPLETE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isComplete]);

  // Real behavior-insight data, fetched once as soon as the task completes.
  useEffect(() => {
    if (!isComplete) return;
    let cancelled = false;
    api.getBehaviorInsight(BACKEND_TASK_ID).then((res) => {
      if (!cancelled) setBackendBehaviorMessage(res?.message ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [isComplete]);

  useEffect(() => {
    if (currentScreen !== "training") return;
    const t = setTimeout(() => setCurrentScreen("resume"), TRAINING_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [currentScreen]);

  // Real resume-briefing data, fetched once as the handover screen mounts.
  useEffect(() => {
    if (currentScreen !== "resume") return;
    let cancelled = false;
    api.getResumeBriefing(BACKEND_TASK_ID).then((res) => {
      if (!cancelled) setBackendBriefing(res?.briefing_sentence ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [currentScreen]);

  const resetAll = useCallback(() => {
    setPhase("intro");
    setCurrentScreen("home");
    setElapsed(0);
    setIdleOverlayOpen(false);
    setIdleAcked(false);
    setIdleReasonCode(null);
    setCriticalOverlayOpen(false);
    setCriticalAcked(false);
    setChatOpen(false);
    setBackendEta(null);
    setBackendBehaviorMessage(null);
    setBackendIdleDuration(null);
    setBackendSafety(null);
    setBackendBriefing(null);
    backendIdleEventIdRef.current = null;
  }, []);

  // Hidden recovery control — force the next key moment to happen right now.
  // Never labeled/visible; exists purely so a stalled live run is rescuable.
  const forceAdvance = useCallback(() => {
    if (phase === "intro") {
      setPhase("live");
      return;
    }
    if (idleOverlayOpen) {
      resolveIdle();
      return;
    }
    if (criticalOverlayOpen) {
      resolveCritical();
      return;
    }
    if (chatOpen) {
      setChatOpen(false);
      return;
    }
    if (elapsed < COMPLETE_T) {
      const next = RECOVERY_MILESTONES.find((m) => m > elapsed) ?? COMPLETE_T;
      setElapsed(next);
      return;
    }
    if (currentScreen === "home" || currentScreen === "task") {
      setCurrentScreen("training");
      return;
    }
    if (currentScreen === "training") {
      setCurrentScreen("resume");
    }
  }, [phase, idleOverlayOpen, criticalOverlayOpen, chatOpen, elapsed, currentScreen, resolveIdle, resolveCritical]);

  useEffect(() => {
    function onKey(e) {
      if (!e.ctrlKey) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        forceAdvance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        resetAll();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forceAdvance, resetAll]);

  // Triple-tap the top-left corner within 600ms = same recovery action, for
  // touch-only tablets with no keyboard.
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  function handleCornerTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      forceAdvance();
    }
  }

  // getLiveTaskSnapshot stays exactly as it was — the pure local fallback.
  // The real backend ETA is layered on top via getValueOrFallback, gated to
  // a range close to the local value so a structurally-different-scale
  // backend number (its model predicts whole-task minutes, not a live
  // countdown) can't make the display jump nonsensically.
  const localSnapshot = getLiveTaskSnapshot(elapsed);
  const resolvedEta = Math.round(
    getValueOrFallback(backendEta, localSnapshot.eta_min, {
      min: Math.max(0, localSnapshot.eta_min - 40),
      max: localSnapshot.eta_min + 40,
    })
  );
  const liveTask = { ...BASE_TASK, ...localSnapshot, eta_min: resolvedEta };

  let { caption, bobState: derivedBobState } = getLiveCaption({
    screen: currentScreen,
    elapsed,
    idleOpen: idleOverlayOpen,
    idleAcked,
    idleReasonCode,
    criticalOpen: criticalOverlayOpen,
    criticalAcked,
  });
  if (isComplete && currentScreen !== "training" && currentScreen !== "resume") {
    caption = getValueOrFallback(backendBehaviorMessage, caption);
  }
  const bobState = idleOverlayOpen ? "listening" : criticalOverlayOpen ? "critical" : derivedBobState;

  const idleCaption = getValueOrFallback(
    backendIdleDuration != null ? `You've been idle for ${backendIdleDuration} minutes. What's going on?` : null,
    bob_captions.idle
  );
  // The backend's rule engine reads the latest golden telemetry row, whose
  // seatbelt is fastened (only an older row shows unfastened) — so it
  // legitimately reports "all clear" even during our scripted critical
  // moment. Only trust its message when it agrees something's triggered;
  // otherwise its answer would contradict the screen it's shown on.
  const safetyDetail = getValueOrFallback(backendSafety?.triggered ? backendSafety.message : null, undefined);
  const resumeBriefing = getValueOrFallback(backendBriefing, undefined);

  const showBottomBob = phase === "live" && !idleOverlayOpen && !criticalOverlayOpen && !chatOpen;

  return (
    <div className="min-h-screen bg-bg pb-64">
      {/* Hidden dev recovery hotspot — invisible, top-left, never branded */}
      <button
        onClick={handleCornerTap}
        aria-hidden="true"
        tabIndex={-1}
        className="fixed left-0 top-0 z-[70] h-14 w-14 opacity-0"
      />

      <div className="mx-auto max-w-2xl px-5 py-6">
        <AnimatePresence mode="wait">
          {currentScreen === "home" && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
              <Home now={liveTask} onOpenTask={() => setCurrentScreen("task")} onOpenTraining={() => setCurrentScreen("training")} />
            </motion.div>
          )}
          {currentScreen === "task" && (
            <motion.div key="task" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
              <button
                onClick={() => setCurrentScreen("home")}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink active:scale-95"
                aria-label="Back to Home"
              >
                <Icon name="arrow-left" size={20} />
              </button>
              <TaskDetail
                task={liveTask}
                recommendation={elapsed >= COMPLETE_T ? "Take the 2-minute Trench Safety Protocols refresher before tomorrow's shift in Zone A." : undefined}
              />
            </motion.div>
          )}
          {currentScreen === "training" && (
            <motion.div key="training" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
              <button
                onClick={() => setCurrentScreen("home")}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink active:scale-95"
                aria-label="Back to Home"
              >
                <Icon name="arrow-left" size={20} />
              </button>
              <TrainingHub />
            </motion.div>
          )}
          {currentScreen === "resume" && (
            <motion.div key="resume" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
              <ResumeHandover caption={caption} ctaLabel="Restart Demo" onContinue={resetAll} briefing={resumeBriefing} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {idleOverlayOpen && <IdleReasonPicker key="idle-overlay" onSubmit={resolveIdle} caption={idleCaption} />}
        {criticalOverlayOpen && (
          <CriticalAlert key="critical-overlay" onAcknowledge={resolveCritical} detail={safetyDetail} />
        )}
      </AnimatePresence>

      {showBottomBob && <BottomRightBob state={bobState} caption={caption} onTap={() => setChatOpen(true)} />}

      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} liveTask={liveTask} />

      {phase === "intro" && <IntroSequence onComplete={() => setPhase("live")} />}
    </div>
  );
}
