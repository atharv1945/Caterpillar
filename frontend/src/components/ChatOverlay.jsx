import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MascotBob from "./MascotBob";
import ChatThread from "./ChatThread";
import Waveform from "./Waveform";
import Icon from "./Icon";
import { chat_quick_questions } from "../mockData";
import { api } from "../utils/api";
import { useSpeech } from "../utils/useSpeech";

const INITIAL_MESSAGE = { from: "bob", text: "Ask me anything about today's task or site safety." };

// Language labels shown in the picker chip
const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "HI" },
  { code: "ta", label: "TA" },
];

// Mounted once at the app root — tapping Bob's dock opens this from anywhere.
export default function ChatOverlay({ open, onClose, liveTask }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [askedIds, setAskedIds] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [language, setLanguage] = useState("en");

  const { sttSupported, ttsSupported, listening, startListening, stopListening, speak } =
    useSpeech({ language });

  // Track the last Bob reply for TTS — we only want to speak the newest one
  const lastBobTextRef = useRef(null);

  // ── Shared "send a question, await Bob's reply" logic ─────────────────
  const sendQuestion = useCallback(
    async (questionText) => {
      if (thinking || !questionText.trim()) return;
      setMessages((m) => [...m, { from: "operator", text: questionText }]);
      setThinking(true);

      // Build a brief context string from current task state (mirrors what
      // statusAnswer() used to do for the scripted quick-questions).
      let context = null;
      if (liveTask) {
        context = `Current task: ${liveTask.task_name ?? "excavation"}, ${liveTask.progress_pct ?? 0}% complete, ETA ${liveTask.eta_min ?? "unknown"} min.`;
      }

      const res = await api.voiceQA(questionText, language, context);
      const answer =
        res?.answer ??
        "I couldn't reach the backend right now — try the Call Officer button for help.";

      setMessages((m) => [...m, { from: "bob", text: answer }]);
      setThinking(false);

      // Auto-speak Bob's reply if TTS is available
      if (ttsSupported) {
        lastBobTextRef.current = answer;
        speak(answer);
      }
    },
    [thinking, language, liveTask, speak, ttsSupported]
  );

  // ── Scripted quick-questions (unchanged UX, now also hits Gemini) ─────
  function statusAnswer() {
    if (!liveTask) return "You're on track — I'll flag anything that needs your attention.";
    return `You're ${liveTask.progress_pct}% through ${liveTask.task_name ?? "your current task"}, on track for about ${liveTask.eta_min} more minutes.`;
  }

  function askQuestion(q) {
    if (thinking) return;
    setAskedIds((a) => [...a, q.id]);
    // "status" quick-question is fully local (live task state only)
    if (q.id === "status") {
      const answer = statusAnswer();
      setMessages((m) => [
        ...m,
        { from: "operator", text: q.question },
        { from: "bob", text: answer },
      ]);
      if (ttsSupported) speak(answer);
    } else {
      // All other quick-questions route through Gemini for a live answer
      sendQuestion(q.question);
    }
  }

  // ── Microphone toggle — STT via Web Speech API ────────────────────────
  function toggleMic() {
    if (listening) {
      stopListening();
      return;
    }
    if (!sttSupported) {
      // Browser doesn't support STT — show a polite note
      setMessages((m) => [
        ...m,
        {
          from: "bob",
          text: "Voice input isn't supported in this browser. Try Chrome or Edge, or tap a question below.",
        },
      ]);
      return;
    }

    startListening({
      onResult: (text) => {
        if (text.trim()) sendQuestion(text);
      },
      onEnd: (error) => {
        if (error) {
          setMessages((m) => [
            ...m,
            {
              from: "bob",
              text: `Microphone issue: ${error}. Make sure you're using Chrome and have allowed microphone permissions.`,
            },
          ]);
        }
      },
    });
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

            {/* Header row */}
            <div className="flex shrink-0 items-center gap-3 px-5 pb-3 pt-4">
              <MascotBob state={listening ? "listening" : "normal"} size={44} showCaption={false} />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-cat-yellow">Ask Bob</p>
                <p className="text-sm font-semibold text-ink">Anytime — I'm always listening</p>
              </div>

              {/* Language selector chips */}
              <div className="flex gap-1 mr-1">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                      language === l.code
                        ? "bg-cat-yellow text-cat-black"
                        : "bg-surface-2 text-ink-dim"
                    }`}
                    aria-label={`Switch to ${l.label}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-dim active:scale-95"
                aria-label="Close chat"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto px-5 pb-3">
              <ChatThread messages={messages} showTyping={thinking} bobSize={30} />
            </div>

            {/* Live waveform while STT is active */}
            {listening && (
              <div className="px-5 pb-2">
                <Waveform active height={40} />
              </div>
            )}

            {/* Quick-question chips */}
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

            {/* Mic / input bar */}
            <div className="shrink-0 px-5 pb-6">
              <button
                onClick={toggleMic}
                disabled={thinking}
                className={`flex w-full items-center gap-2 rounded-full border px-4 py-3 transition-colors ${
                  listening
                    ? "border-cat-yellow/40 bg-cat-yellow/10 text-cat-yellow"
                    : thinking
                    ? "border-white/5 bg-surface text-ink-dim opacity-50 cursor-not-allowed"
                    : "border-white/10 bg-surface-2 text-ink-dim"
                }`}
              >
                <Icon name="mic" size={16} />
                <span className="text-sm">
                  {listening
                    ? "Listening…"
                    : thinking
                    ? "Thinking…"
                    : "Tap to ask a question…"}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
