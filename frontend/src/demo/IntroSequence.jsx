import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MascotBob from "../components/MascotBob";
import TypeOnText from "../components/TypeOnText";
import { BOB_DOCK_LAYOUT_ID, BOB_DOCK_BOTTOM, BOB_DOCK_RIGHT } from "../components/bobDock";

const CENTER_SIZE = 270;
const DOCK_TRANSITION = { duration: 0.56, ease: [0.22, 1, 0.36, 1] };
// Numeric fallback for the docked box math below — matches the clamp()
// BottomRightBob renders at typical phone/tablet widths closely enough that
// the layoutId handoff lands with no visible correction.
const DOCKED_SIZE_PX = 140;

// Matches the "Good morning!" TypeOnText call below (startDelay 0.35,
// wordDelay 0.09, 2 words, 0.22s per-word fade) — the moment the last word
// finishes animating in, plus a small margin.
const GREETING_TYPED_MS = 700;

// Bob's opening beat, prepended ahead of the live shift as its own skippable
// intro. One motion.div (layoutId shared with BottomRightBob) persists across
// the centered → docked layout change AND across the handoff into the
// persistent dock, so Framer Motion computes one continuous move+resize
// instead of two mascots cutting/refading — this is also what fixes Bob
// resting top-right instead of bottom-right once the intro settles.
export default function IntroSequence({ onComplete }) {
  const [greetingTyped, setGreetingTyped] = useState(false);
  const [docked, setDocked] = useState(false);
  const [showDockedCaption, setShowDockedCaption] = useState(false);

  // Once the greeting has finished typing on, hold here indefinitely —
  // no auto-advance. The move-to-dock animation only starts once the
  // operator taps (see handleTapToContinue below).
  useEffect(() => {
    const t = setTimeout(() => setGreetingTyped(true), GREETING_TYPED_MS);
    return () => clearTimeout(t);
  }, []);

  function handleTapToContinue() {
    if (!greetingTyped || docked) return;
    setDocked(true);
  }

  // Auto-hand off into the live shift shortly after Bob finishes speaking —
  // no presenter click needed, this now reads as one continuous app boot.
  useEffect(() => {
    if (!showDockedCaption) return;
    const t = setTimeout(() => onComplete?.(), 1800);
    return () => clearTimeout(t);
  }, [showDockedCaption, onComplete]);

  const bobBoxStyle = docked
    ? { position: "absolute", bottom: BOB_DOCK_BOTTOM, right: BOB_DOCK_RIGHT, width: DOCKED_SIZE_PX, height: DOCKED_SIZE_PX }
    : {
        position: "absolute",
        top: `calc(50% - ${CENTER_SIZE / 2}px)`,
        left: `calc(50% - ${CENTER_SIZE / 2}px)`,
        width: CENTER_SIZE,
        height: CENTER_SIZE,
      };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden" onClick={handleTapToContinue}>
      {/* backdrop hides Home while centered, fades away as Bob docks so the
          home screen reads as fading in behind him */}
      <motion.div
        className="absolute inset-0 bg-bg"
        initial={{ opacity: 1 }}
        animate={{ opacity: docked ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Once Home is revealed, its own content sits right where Bob docks —
          this soft corner vignette (matching BottomRightBob's) keeps him +
          his caption legible without fully hiding the screen underneath. */}
      <motion.div
        className="pointer-events-none absolute bottom-0 right-0"
        style={{
          width: "min(78vw, 360px)",
          height: "min(62vh, 480px)",
          background: "radial-gradient(130% 130% at 100% 100%, var(--color-bg) 0%, var(--color-bg) 65%, transparent 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: docked ? 1 : 0 }}
        transition={{ duration: 0.45, delay: docked ? 0.15 : 0 }}
      />

      <motion.div
        layoutId={BOB_DOCK_LAYOUT_ID}
        style={bobBoxStyle}
        transition={DOCK_TRANSITION}
        onLayoutAnimationComplete={() => docked && setShowDockedCaption(true)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="h-full w-full"
        >
          <MascotBob state="normal" size={docked ? DOCKED_SIZE_PX : CENTER_SIZE} showCaption={false} />
        </motion.div>
      </motion.div>

      {/* "Good morning!" — lives only through the centered hold, exits fast
          right as the dock move begins */}
      <AnimatePresence>
        {!docked && (
          <motion.div
            key="intro-greeting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="absolute inset-x-0 flex justify-center px-6"
            style={{ top: `calc(50% + ${CENTER_SIZE / 2 + 24}px)` }}
          >
            <div className="glass rounded-2xl border border-white/10 px-6 py-3 text-xl font-bold text-ink shadow-xl">
              <TypeOnText text="Good morning!" startDelay={0.35} wordDelay={0.09} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle, unobtrusive tap affordance — appears only once the greeting
          has finished typing on, and holds (no timeout) until tapped. */}
      <AnimatePresence>
        {!docked && greetingTyped && (
          <motion.div
            key="intro-tap-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 flex justify-center px-6"
            style={{ top: `calc(50% + ${CENTER_SIZE / 2 + 74}px)` }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-ink-dim">Tap to continue</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Here's your first task." — anchored to Bob's docked position so it
          reads as coming from him, not as a disconnected banner */}
      <AnimatePresence>
        {docked && showDockedCaption && (
          <motion.div
            key="intro-docked-caption"
            initial={{ opacity: 0, x: 18, y: 6 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="glass absolute max-w-[190px] rounded-2xl rounded-br-sm border border-white/10 px-4 py-2.5 text-sm font-semibold text-ink shadow-lg"
            style={{ bottom: BOB_DOCK_BOTTOM + 24, right: BOB_DOCK_RIGHT + DOCKED_SIZE_PX + 12 }}
          >
            <TypeOnText text="Here's your first task." />
            <span className="absolute -right-1.5 bottom-4 h-3 w-3 rotate-45 border-r border-b border-white/10 bg-surface" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
