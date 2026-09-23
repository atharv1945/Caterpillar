import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../components/Icon";
import ChatThread from "../components/ChatThread";
import { training_content, training_qa } from "../mockData";

const VIDEO_DURATION_MS = 9000;

export default function TrainingHub() {
  const [videoState, setVideoState] = useState("idle"); // idle | playing | done
  const [callState, setCallState] = useState("idle"); // idle | connecting | connected
  const [visibleCount, setVisibleCount] = useState(0);
  const video = training_content[0];

  // No real video file exists for the demo — rather than a spinner that
  // spins forever regardless of whether anyone's watching, this plays a
  // fixed-length placeholder progress bar and lands on a clear "done" state,
  // so it reads as an intentional short lesson rather than a broken stub.
  useEffect(() => {
    if (videoState !== "playing") return;
    const t = setTimeout(() => setVideoState("done"), VIDEO_DURATION_MS);
    return () => clearTimeout(t);
  }, [videoState]);

  // Pre-scripted Q&A bubbles appear one at a time — no live STT/TTS, just a
  // short reveal delay so the exchange feels like it's happening live.
  useEffect(() => {
    setVisibleCount(0);
    const timers = training_qa.map((_, i) =>
      setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), 500 + i * 700)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  function callOfficer() {
    setCallState("connecting");
    setTimeout(() => setCallState("connected"), 2200);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink">Training Hub</h1>

      <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-surface-2 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cat-yellow/15 via-transparent to-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          {videoState === "idle" && (
            <>
              <motion.button
                onClick={() => setVideoState("playing")}
                whileTap={{ scale: 0.9 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-cat-yellow text-cat-black shadow-lg"
              >
                <Icon name="play" size={26} />
              </motion.button>
              <p className="text-sm font-semibold text-ink">{video.title}</p>
              <p className="text-xs text-ink-dim">{video.duration_min} min · {video.language.toUpperCase()}</p>
            </>
          )}
          {videoState === "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full max-w-[220px] flex-col items-center gap-3"
            >
              <p className="text-sm font-medium text-ink-dim">Playing “{video.title}”…</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-cat-yellow"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: VIDEO_DURATION_MS / 1000, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
          {videoState === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success">
                <Icon name="check" size={28} />
              </div>
              <p className="text-sm font-semibold text-ink">Watched — {video.title}</p>
            </motion.div>
          )}
        </div>
      </div>

      <div>
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-ink-dim">Ask Bob</p>
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-surface p-4 shadow-lg">
          <ChatThread messages={training_qa.slice(0, visibleCount)} showTyping={visibleCount < training_qa.length} />
          <div className="mt-1 flex items-center gap-2 rounded-full border border-white/10 bg-surface-2 px-4 py-3 text-ink-dim">
            <Icon name="mic" size={16} />
            <span className="text-sm">Tap to ask a question…</span>
          </div>
        </div>
      </div>

      <motion.button
        onClick={callOfficer}
        whileTap={{ scale: 0.97 }}
        disabled={callState !== "idle"}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface-2 text-base font-bold text-ink"
      >
        <AnimatePresence mode="wait">
          {callState === "idle" && (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <Icon name="phone" size={18} className="text-info" /> Call Safety Officer
            </motion.span>
          )}
          {callState === "connecting" && (
            <motion.span key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-info">
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-info"
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              Connecting…
            </motion.span>
          )}
          {callState === "connected" && (
            <motion.span key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-success">
              <Icon name="check" size={18} /> Connected to Officer Rao
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
