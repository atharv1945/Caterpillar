import { motion, AnimatePresence } from "framer-motion";
import MascotBob from "./MascotBob";

// Generalized Ask-Bob chat bubble list — originally built inline for Training
// Hub, now shared by Training Hub and the global ChatOverlay so both read as
// the same conversational pattern instead of two different chat widgets.
export default function ChatThread({ messages, showTyping = false, bobSize = 32 }) {
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <motion.div
            key={m.id ?? i}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex items-end gap-2 ${m.from === "operator" ? "flex-row-reverse" : ""}`}
          >
            {m.from === "bob" && <MascotBob state="normal" size={bobSize} showCaption={false} />}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === "bob"
                  ? "rounded-bl-sm bg-surface-2 text-ink"
                  : "rounded-br-sm bg-cat-yellow text-cat-black font-medium"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {showTyping && (
        <div className="flex items-center gap-1.5 pl-10">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-ink-dim"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
