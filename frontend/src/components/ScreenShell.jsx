import { motion } from "framer-motion";
import Icon from "./Icon";

export default function ScreenShell({ title, onBack, right, children, noPad = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="mx-auto flex min-h-full w-full max-w-2xl flex-col"
    >
      {(title || onBack) && (
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-bg/80 px-5 py-4 backdrop-blur-md">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink active:scale-95 transition-transform"
              aria-label="Back"
            >
              <Icon name="arrow-left" size={20} />
            </button>
          )}
          {title && <h1 className="text-lg font-bold text-ink">{title}</h1>}
          <div className="ml-auto">{right}</div>
        </div>
      )}
      <div className={noPad ? "flex-1" : "flex-1 px-5 py-5"}>{children}</div>
    </motion.div>
  );
}
