import { AnimatePresence, motion } from "framer-motion";
import MascotBob from "./MascotBob";
import TypeOnText from "./TypeOnText";

export default function BobNarrationBar({ state = "normal", caption }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/5 bg-bg/85 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            key={caption}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3"
          >
            <div className="relative h-12 w-12 shrink-0">
              <div className="absolute left-1/2 top-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.34]">
                <MascotBob state={state} size={140} showCaption={false} />
              </div>
            </div>
            <p className="text-sm font-semibold leading-snug text-ink">
              <TypeOnText text={caption} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
