import { motion } from "framer-motion";

// Fades caption text in word-by-word instead of snapping in — used anywhere
// Bob "speaks" so the UI reads as alive rather than a static label swap.
export default function TypeOnText({ text = "", className = "", wordDelay = 0.045, startDelay = 0 }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: startDelay + i * wordDelay, duration: 0.22, ease: "easeOut" }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
