import { motion } from "framer-motion";

const BAR_COUNT = 24;

export default function Waveform({ active = true, color = "#ffcd11", height = 64 }) {
  return (
    <div className="flex items-center justify-center gap-1" style={{ height }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const base = 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.75;
        return (
          <motion.span
            key={i}
            className="w-1.5 rounded-full"
            style={{ background: color }}
            animate={
              active
                ? { height: [`${base * 30}%`, `${base * 100}%`, `${base * 40}%`] }
                : { height: "12%" }
            }
            transition={{
              duration: 0.6 + (i % 5) * 0.08,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: i * 0.03,
            }}
          />
        );
      })}
    </div>
  );
}
