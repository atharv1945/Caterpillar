import { useState } from "react";
import { motion } from "framer-motion";
import MascotBob from "../components/MascotBob";
import Waveform from "../components/Waveform";
import Icon from "../components/Icon";
import { bob_captions } from "../mockData";

export default function VoiceOverlay({ onClose }) {
  const [listening, setListening] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#141821] to-bg px-6 py-10"
    >
      <button
        onClick={onClose}
        className="self-end flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink"
        aria-label="Close"
      >
        <Icon name="x" size={20} />
      </button>

      <div className="flex flex-col items-center gap-6">
        <MascotBob state="listening" size={220} caption={bob_captions.listening} />
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Waveform active={listening} />
        <motion.button
          onClick={() => setListening((v) => !v)}
          whileTap={{ scale: 0.94 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-cat-yellow text-cat-black shadow-2xl"
        >
          <Icon name="mic" size={30} />
        </motion.button>
        <p className="text-sm font-medium text-ink-dim">Tap to {listening ? "mute" : "talk"}</p>
      </div>
    </motion.div>
  );
}
