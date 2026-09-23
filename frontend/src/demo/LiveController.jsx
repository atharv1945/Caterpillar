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
import { tasks } from "../mockData";
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

const BASE_TASK = tasks.find((t) => t.status === "NOW");

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
  const [criticalOverlayOpen, setCriticalOverlayOpen] = useState(false);
  const [criticalAcked, setCriticalAcked] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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

  // Idle detection fires itself the moment the threshold is crossed.
  useEffect(() => {
    if (elapsed >= IDLE_THRESHOLD_T && !idleAcked && !idleOverlayOpen) {
      setIdleOverlayOpen(true);
      playListeningChime();
    }
  }, [elapsed, idleAcked, idleOverlayOpen]);

  // Safety event fires itself the moment its threshold is crossed.
  useEffect(() => {
    if (elapsed >= SAFETY_T && !criticalAcked && !criticalOverlayOpen) {
      setCriticalOverlayOpen(true);
      playCriticalAlert();
    }
  }, [elapsed, criticalAcked, criticalOverlayOpen]);

  const resolveIdle = useCallback(() => {
    setIdleAcked(true);
    setIdleOverlayOpen(false);
  }, []);

  const resolveCritical = useCallback(() => {
    setCriticalAcked(true);
    setCriticalOverlayOpen(false);
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

  useEffect(() => {
    if (currentScreen !== "training") return;
    const t = setTimeout(() => setCurrentScreen("resume"), TRAINING_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [currentScreen]);

  const resetAll = useCallback(() => {
    setPhase("intro");
    setCurrentScreen("home");
    setElapsed(0);
    setIdleOverlayOpen(false);
    setIdleAcked(false);
    setCriticalOverlayOpen(false);
    setCriticalAcked(false);
    setChatOpen(false);
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

  const snapshot = getLiveTaskSnapshot(elapsed);
  const liveTask = { ...BASE_TASK, ...snapshot };

  const { caption, bobState: derivedBobState } = getLiveCaption({
    screen: currentScreen,
    elapsed,
    idleOpen: idleOverlayOpen,
    idleAcked,
    criticalOpen: criticalOverlayOpen,
    criticalAcked,
  });
  const bobState = idleOverlayOpen ? "listening" : criticalOverlayOpen ? "critical" : derivedBobState;

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
              <ResumeHandover caption={caption} ctaLabel="Restart Demo" onContinue={resetAll} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {idleOverlayOpen && <IdleReasonPicker key="idle-overlay" onSubmit={resolveIdle} />}
        {criticalOverlayOpen && <CriticalAlert key="critical-overlay" onAcknowledge={resolveCritical} />}
      </AnimatePresence>

      {showBottomBob && <BottomRightBob state={bobState} caption={caption} onTap={() => setChatOpen(true)} />}

      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} liveTask={liveTask} />

      {phase === "intro" && <IntroSequence onComplete={() => setPhase("live")} />}
    </div>
  );
}
