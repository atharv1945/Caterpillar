import { motion } from "framer-motion";
import MascotBob from "./MascotBob";
import Icon from "./Icon";

export default function BobDock({ state = "normal", onTap }) {
  return (
    <motion.button
      onClick={onTap}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-5 right-5 z-40 flex h-[76px] w-[76px] items-center justify-center rounded-full border border-white/10 bg-surface shadow-2xl"
      aria-label="Talk to Bob"
    >
      <div className="pointer-events-none scale-[0.62]">
        <MascotBob state={state} size={140} showCaption={false} />
      </div>
      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cat-yellow text-cat-black shadow">
        <Icon name="mic" size={13} />
      </span>
    </motion.button>
  );
}
