import { motion } from "framer-motion";

export default function ProgressBar({ value = 0, color = "#ffcd11", height = 10, className = "" }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-white/10 ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}
