import { useState } from "react";
import { motion } from "framer-motion";
import MascotBob from "../components/MascotBob";
import ReasonChip from "../components/ReasonChip";
import { idle_reason_options, bob_captions } from "../mockData";

export default function IdleReasonPicker({ onSubmit, caption = bob_captions.idle }) {
  const [selected, setSelected] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 240 }}
        className="rounded-t-[32px] border-t border-white/10 bg-surface px-6 pb-28 pt-6 shadow-2xl"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-5 flex items-center gap-3">
          <MascotBob state="listening" size={56} showCaption={false} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-attention">Idle 5 min</p>
            <p className="text-lg font-bold text-ink">{caption}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {idle_reason_options.map((r) => (
            <ReasonChip
              key={r.code}
              icon={r.icon}
              label={r.label}
              selected={selected === r.code}
              onClick={() => setSelected(r.code)}
            />
          ))}
        </div>

        <motion.button
          disabled={!selected}
          onClick={() => onSubmit(selected)}
          whileTap={{ scale: 0.97 }}
          className="mt-6 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-cat-yellow text-base font-extrabold text-cat-black transition-opacity disabled:opacity-30"
        >
          Confirm
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
