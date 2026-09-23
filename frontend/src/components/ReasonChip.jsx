import { motion } from "framer-motion";
import Icon from "./Icon";

export default function ReasonChip({ icon, label, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition-colors duration-300 ${
        selected
          ? "border-cat-yellow bg-cat-yellow/15 text-cat-yellow"
          : "border-white/10 bg-surface-2 text-ink hover:border-white/25"
      }`}
    >
      <Icon name={icon} size={26} />
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </motion.button>
  );
}
