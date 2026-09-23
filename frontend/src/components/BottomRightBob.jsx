import { motion } from "framer-motion";
import MascotBob from "./MascotBob";
import Icon from "./Icon";
import { BOB_DOCK_LAYOUT_ID, BOB_DOCK_SIZE } from "./bobDock";

// The persistent mascot dock used on every screen except the full-screen
// Critical Safety Alert (which already owns a large centered Bob of its
// own). Sized to a third of the viewport width so he reads as a real
// co-pilot presence, not a small corner icon. Tappable everywhere to open
// the global chat overlay.
export default function BottomRightBob({ state = "normal", caption, onTap }) {
  return (
    <>
      {/* Whatever screen content sits behind this corner gets a soft
          vignette so Bob + his caption stay legible without needing every
          screen to reserve exact empty space for him. */}
      <div
        className="pointer-events-none fixed bottom-0 right-0 z-20"
        style={{
          width: "min(78vw, 360px)",
          height: "min(62vh, 480px)",
          background: "radial-gradient(130% 130% at 100% 100%, var(--color-bg) 0%, var(--color-bg) 65%, transparent 100%)",
        }}
      />
      <div className="fixed bottom-20 right-4 z-30 flex justify-end sm:right-6">
        <motion.button
          layoutId={BOB_DOCK_LAYOUT_ID}
          onClick={onTap}
          whileTap={{ scale: 0.96 }}
          className="relative"
          aria-label="Chat with Bob"
        >
          <MascotBob state={state} caption={caption} size={BOB_DOCK_SIZE} />
          <span className="absolute -bottom-1 right-[6%] flex h-8 w-8 items-center justify-center rounded-full bg-cat-yellow text-cat-black shadow-lg">
            <Icon name="mic" size={14} />
          </span>
        </motion.button>
      </div>
    </>
  );
}
