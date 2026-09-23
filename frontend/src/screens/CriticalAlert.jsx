import { motion } from "framer-motion";
import MascotBob from "../components/MascotBob";
import Icon from "../components/Icon";
import { safety_events, bob_captions } from "../mockData";

export default function CriticalAlert({ onAcknowledge, caption = bob_captions.critical, detail }) {
  const event = safety_events[0];
  const detailText = detail ?? event.message;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#3a0d0d] via-[#1a0606] to-bg px-6 pt-10 pb-28"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 1.1, repeat: Infinity }}
        style={{ background: "radial-gradient(circle at 50% 20%, #ef4444 0%, transparent 60%)" }}
      />

      <div className="flex flex-col items-center gap-4 pt-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-critical/20 text-critical"
        >
          <Icon name="shield-alert" size={44} />
        </motion.div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-critical">Critical Safety Alert</p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <MascotBob state="critical" size={180} showCaption={false} />
        <p className="max-w-xs text-center text-xl font-bold leading-snug text-ink">
          {caption}
        </p>
        <p className="max-w-xs text-center text-sm text-ink-dim">{detailText}</p>
      </div>

      <motion.button
        onClick={onAcknowledge}
        whileTap={{ scale: 0.96 }}
        className="flex min-h-[64px] w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-critical text-lg font-extrabold text-white shadow-2xl"
      >
        <Icon name="check" size={22} /> I've fastened my seatbelt
      </motion.button>
    </motion.div>
  );
}
