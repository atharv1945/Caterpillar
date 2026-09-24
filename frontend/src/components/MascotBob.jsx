import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import TypeOnText from "./TypeOnText";

// Bob — the operator's co-pilot mascot.
// Layered inline SVG (hard hat / head-body / eyes as separate <g> groups) so
// each layer can animate independently. Driven entirely by the `state` prop:
// "normal" | "listening" | "warning" | "critical" | "coaching"

const STATE_CONFIG = {
  normal: { glow: null, tint: "#3b4252", pulseSpeed: 2.4, label: "Idle" },
  listening: { glow: "#3b82f6", tint: "#3b4252", pulseSpeed: 1.1, label: "Listening" },
  warning: { glow: "#ffcd11", tint: "#5c4a12", pulseSpeed: 0.9, label: "Attention" },
  critical: { glow: "#ef4444", tint: "#5c1f1f", pulseSpeed: 0.5, label: "Critical" },
  coaching: { glow: "#22c55e", tint: "#3b4252", pulseSpeed: 2, label: "Nice work" },
};

export default function MascotBob({
  state = "normal",
  size = 140,
  caption,
  showCaption = true,
  className = "",
}) {
  const cfg = STATE_CONFIG[state] ?? STATE_CONFIG.normal;
  const isCritical = state === "critical";
  const isWarning = state === "warning";
  const isListening = state === "listening";
  const isCoaching = state === "coaching";

  // Pulse plays exactly 3 cycles per state occurrence, then holds steady at
  // the same "lit" frame the pulse starts/ends on — looping forever read as
  // distracting over a long state. `pulseGen` forces a fresh mount (and so a
  // fresh repeat count) each time `state` actually changes, including
  // re-entering the same state after a demo reset.
  const [pulseSettled, setPulseSettled] = useState(false);
  const [pulseGen, setPulseGen] = useState(0);
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (prevStateRef.current !== state) {
      prevStateRef.current = state;
      setPulseSettled(false);
      setPulseGen((g) => g + 1);
    }
  }, [state]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {showCaption && caption && (
        <motion.div
          key={caption}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="glass max-w-[260px] rounded-2xl border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-ink shadow-lg"
        >
          <TypeOnText text={caption} />
        </motion.div>
      )}

      <motion.div
        style={{ width: size, height: size }}
        animate={isCritical ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
        transition={isCritical ? { duration: 0.42, repeat: Infinity, ease: "easeInOut" } : {}}
        className="relative"
      >
        {cfg.glow && (
          pulseSettled ? (
            // Steady hold — same color/opacity/scale as the pulse's shared
            // start/end ("lit") keyframe, so settling into this never reads
            // as a snap.
            <span
              key={`glow-settled-${pulseGen}`}
              className="absolute inset-0 rounded-full"
              style={{ background: cfg.glow, filter: "blur(6px)", opacity: 0.55, transform: "scale(0.85)" }}
            />
          ) : (
            <motion.span
              key={`glow-pulse-${pulseGen}`}
              className="absolute inset-0 rounded-full"
              style={{ background: cfg.glow, filter: "blur(6px)" }}
              animate={{ scale: [0.85, 1.5, 1.5, 0.85], opacity: [0.55, 0, 0, 0.55] }}
              transition={{ duration: cfg.pulseSpeed, repeat: 3, ease: "easeOut" }}
              onAnimationComplete={() => setPulseSettled(true)}
            />
          )
        )}

        <motion.svg
          viewBox="0 0 200 200"
          width="100%"
          height="100%"
          className="relative"
          animate={
            isListening
              ? { scale: 1.03, y: -2 }
              : isCoaching
              ? { y: [0, -10, 0] }
              : { scale: [1, 1.045, 1] }
          }
          transition={
            isCoaching
              ? { duration: 0.55, repeat: 2, ease: "easeOut" }
              : isListening
              ? { duration: 0.3, ease: "easeOut" }
              : { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* BODY */}
          <g>
            <ellipse cx="100" cy="176" rx="46" ry="8" fill="#000" opacity="0.25" />
            <path
              d="M60 190 C58 140 62 108 100 108 C138 108 142 140 140 190 Z"
              fill={cfg.tint}
              stroke="#00000030"
              strokeWidth="1"
            />
            {/* CAT-yellow chest badge */}
            <rect x="88" y="140" width="24" height="14" rx="4" fill="#ffcd11" opacity="0.9" />

            {/* arms */}
            {isCoaching ? (
              <>
                <path d="M62 150 C40 140 30 118 34 100" stroke={cfg.tint} strokeWidth="16" strokeLinecap="round" fill="none" />
                <circle cx="34" cy="98" r="10" fill={cfg.tint} />
                <path d="M30 92 L30 82 M34 90 L34 78 M38 92 L39 81" stroke={cfg.tint} strokeWidth="6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M62 155 C50 160 44 172 46 184" stroke={cfg.tint} strokeWidth="16" strokeLinecap="round" fill="none" />
                <path d="M138 155 C150 160 156 172 154 184" stroke={cfg.tint} strokeWidth="16" strokeLinecap="round" fill="none" />
              </>
            )}
          </g>

          {/* HEAD */}
          <g>
            <circle cx="100" cy="92" r="46" fill="#c9cdd6" />
            <circle cx="100" cy="98" r="46" fill="#dfe3ea" />

            {/* EYES — listening stays wide/alert (no blink) so it reads
                differently from normal at a glance, not just via the glow */}
            <motion.g
              animate={
                isCritical || isListening
                  ? { scaleY: 1 }
                  : { scaleY: [1, 1, 1, 0.08, 1] }
              }
              transition={
                isCritical || isListening
                  ? {}
                  : { duration: 5, repeat: Infinity, times: [0, 0.9, 0.94, 0.96, 1] }
              }
              style={{ transformOrigin: "100px 96px" }}
            >
              <ellipse cx="86" cy="96" rx={isListening ? 6.5 : 5.5} ry={isCritical ? 7 : isListening ? 7.5 : 6} fill="#161822" />
              <ellipse cx="114" cy="96" rx={isListening ? 6.5 : 5.5} ry={isCritical ? 7 : isListening ? 7.5 : 6} fill="#161822" />
              {isListening && (
                <>
                  <circle cx="88" cy="94" r="1.4" fill="#dfe3ea" />
                  <circle cx="116" cy="94" r="1.4" fill="#dfe3ea" />
                </>
              )}
              {(isWarning || isCritical) && (
                <>
                  <path d="M78 86 L94 90" stroke="#161822" strokeWidth="3" strokeLinecap="round" />
                  <path d="M122 86 L106 90" stroke="#161822" strokeWidth="3" strokeLinecap="round" />
                </>
              )}
            </motion.g>

            {/* MOUTH */}
            {isCoaching ? (
              <path d="M84 112 Q100 126 116 112" stroke="#161822" strokeWidth="4" strokeLinecap="round" fill="none" />
            ) : isCritical ? (
              <path d="M86 116 Q100 108 114 116" stroke="#161822" strokeWidth="4" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M88 113 Q100 119 112 113" stroke="#161822" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            )}
          </g>

          {/* HARD HAT */}
          <motion.g
            animate={
              isListening
                ? { rotate: -4 }
                : isCritical
                ? { rotate: 0 }
                : { rotate: [0, 3, 0, -3, 0] }
            }
            transition={
              isCritical
                ? {}
                : isListening
                ? { duration: 0.3 }
                : { duration: 4.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }
            }
            style={{ transformOrigin: "100px 66px" }}
          >
            <path
              d="M56 62 C56 34 144 34 144 62 L150 66 L50 66 Z"
              fill="#ffcd11"
              stroke="#7a5c00"
              strokeWidth="1.5"
            />
            <rect x="48" y="64" width="104" height="10" rx="5" fill="#ffcd11" stroke="#7a5c00" strokeWidth="1.5" />
            <rect x="94" y="40" width="12" height="8" rx="2" fill="#7a5c00" opacity="0.5" />
          </motion.g>

          {/* LISTENING cue — small sound-wave ticks beside the ear, on top of
              the glow ring, so listening reads unmistakably even without it */}
          {isListening && (
            <motion.g
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M158 88 q6 8 0 16" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M166 82 q12 14 0 28" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
            </motion.g>
          )}
        </motion.svg>
      </motion.div>
    </div>
  );
}
