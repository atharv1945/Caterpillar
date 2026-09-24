import { useState, useRef, useCallback, useEffect } from "react";
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
  const [textInput, setTextInput] = useState("");

  const { sttSupported, ttsSupported, hasNativeVoice, listening, startListening, stopListening, speak } =
    useSpeech({ language });

  // Track the last Bob reply for TTS — we only want to speak the newest one
  const lastBobTextRef = useRef(null);

  // Warn if native voice is missing when switching languages
  useEffect(() => {
    if (language !== "en" && !hasNativeVoice && ttsSupported) {
      setMessages((m) => [
        ...m,
        {
          from: "bob",
          text: `Your device doesn't have a ${language.toUpperCase()} voice installed. I can understand you, but I won't be able to speak the replies out loud properly.`,
        },
      ]);
    }
  }, [language, hasNativeVoice, ttsSupported]);

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

  // ── Typed free-text — submits through the exact same sendQuestion path
  // as voice input and quick-questions, so behavior is consistent regardless
  // of how the operator asked. ───────────────────────────────────────────
  function handleTextSubmit(e) {
    e.preventDefault();
    const text = textInput.trim();
    if (!text || thinking) return;
    setTextInput("");
    sendQuestion(text);
  }

  // ── Microphone toggle — STT via Web Speech API ────────────────────────
  // Explicit push-to-talk: tap once to start listening, tap the SAME button
  // again to stop — stopping finalizes whatever was captured and submits it
  // through the same sendQuestion path (native SpeechRecognition.stop()
  // fires one last onresult with the final transcript before onend).
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

            {/* Text input + push-to-talk mic bar */}
            <div className="shrink-0 px-5 pb-6">
              {(thinking || listening) && (
                <p className="mb-2 px-1 text-xs font-medium text-ink-dim">
                  {thinking ? "Thinking…" : "Listening — tap the mic again to stop and send"}
                </p>
              )}
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a question…"
                  disabled={thinking}
                  className="flex-1 rounded-full border border-white/10 bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-dim outline-none focus:border-cat-yellow/40 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={thinking || !textInput.trim()}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cat-yellow text-cat-black transition-opacity disabled:opacity-30"
                >
                  <Icon name="send" size={18} />
                </button>
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={thinking}
                  aria-label={listening ? "Stop and send" : "Start voice question"}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    listening
                      ? "border-cat-yellow/40 bg-cat-yellow/10 text-cat-yellow"
                      : thinking
                      ? "border-white/5 bg-surface text-ink-dim opacity-50 cursor-not-allowed"
                      : "border-white/10 bg-surface-2 text-ink-dim"
                  }`}
                >
                  <Icon name={listening ? "stop" : "mic"} size={16} filled={listening} />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
