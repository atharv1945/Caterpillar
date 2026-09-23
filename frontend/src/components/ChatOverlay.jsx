import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MascotBob from "./MascotBob";
import ChatThread from "./ChatThread";
import Waveform from "./Waveform";
import Icon from "./Icon";
import { chat_quick_questions } from "../mockData";

const INITIAL_MESSAGE = { from: "bob", text: "Ask me anything about today's task or site safety." };

// Mounted once at the app root — tapping Bob's dock opens this from anywhere,
// on top of whatever screen is currently showing, and closes back to exactly
// that same screen/state underneath.
export default function ChatOverlay({ open, onClose, liveTask }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [askedIds, setAskedIds] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);

  function statusAnswer() {
    if (!liveTask) return "You're on track — I'll flag anything that needs your attention.";
    return `You're ${liveTask.progress_pct}% through ${liveTask.task_name ?? "your current task"}, on track for about ${liveTask.eta_min} more minutes.`;
  }

  function askQuestion(q) {
    if (thinking) return;
    setMessages((m) => [...m, { from: "operator", text: q.question }]);
    setAskedIds((a) => [...a, q.id]);
    setThinking(true);
    const answer = q.id === "status" ? statusAnswer() : q.answer;
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bob", text: answer }]);
      setThinking(false);
    }, 700);
  }

  function toggleMic() {
    setListening((v) => !v);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="chat-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[82vh] flex-col rounded-t-[32px] border-t border-white/10 bg-surface shadow-2xl"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-white/15" />

            <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4">
              <MascotBob state={listening ? "listening" : "normal"} size={44} showCaption={false} />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-cat-yellow">Ask Bob</p>
                <p className="text-sm font-semibold text-ink">Anytime — I'm always listening</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-dim active:scale-95"
                aria-label="Close chat"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-3">
              <ChatThread messages={messages} showTyping={thinking} bobSize={30} />
            </div>

            {listening && (
              <div className="px-5 pb-2">
                <Waveform active height={40} />
              </div>
            )}

            {askedIds.length < chat_quick_questions.length && (
              <div className="flex shrink-0 gap-2 overflow-x-auto px-5 pb-3">
                {chat_quick_questions
                  .filter((q) => !askedIds.includes(q.id))
                  .map((q) => (
                    <button
                      key={q.id}
                      onClick={() => askQuestion(q)}
                      className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-surface-2 px-4 py-2 text-sm font-semibold text-ink active:scale-95"
                    >
                      {q.question}
                    </button>
                  ))}
              </div>
            )}

            <div className="shrink-0 px-5 pb-6">
              {askedIds.length < chat_quick_questions.length ? (
                <button
                  onClick={toggleMic}
                  className={`flex w-full items-center gap-2 rounded-full border px-4 py-3 transition-colors ${
                    listening ? "border-cat-yellow/40 bg-cat-yellow/10 text-cat-yellow" : "border-white/10 bg-surface-2 text-ink-dim"
                  }`}
                >
                  <Icon name="mic" size={16} />
                  <span className="text-sm">{listening ? "Listening…" : "Tap to ask a question…"}</span>
                </button>
              ) : (
                <div className="rounded-full border border-white/10 bg-surface-2 px-4 py-3 text-center text-sm text-ink-dim">
                  That's everything I've got for this task — ask me again once you're moving.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
