import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { training_content } from "../mockData";

const VIDEO_DURATION_MS = 9000;
const CATEGORY_ICON = { Safety: "shield-alert", Excavator: "truck" };

function groupByCategory(items) {
  const map = new Map();
  items.forEach((item) => {
    const cat = item.category ?? "General";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(item);
  });
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

const categories = groupByCategory(training_content);

// A separate, standalone screen reachable via its own sidebar icon — deliberately
// NOT part of LiveController's currentScreen/AnimatePresence stack or the
// elapsed clock's pause system, so browsing training never affects (or is
// affected by) the live demo timeline. z-40 (one below the idle/critical
// overlays at z-50) so a genuine safety alert can still surface on top of
// this if it fires while the operator is here.
export default function TrainingCenterOverlay({ open, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [videoState, setVideoState] = useState("idle"); // idle | playing | done
  const [callState, setCallState] = useState("idle"); // idle | connecting | connected

  useEffect(() => {
    if (videoState !== "playing") return;
    const t = setTimeout(() => setVideoState("done"), VIDEO_DURATION_MS);
    return () => clearTimeout(t);
  }, [videoState]);

  // Reset internal navigation each time this is (re)opened, so it never
  // resumes mid-video or deep in a category from a previous visit.
  useEffect(() => {
    if (!open) return;
    setSelectedCategory(null);
    setActiveItem(null);
    setVideoState("idle");
    setCallState("idle");
  }, [open]);

  function openItem(item) {
    setActiveItem(item);
    setVideoState("idle");
  }

  function callOfficer() {
    setCallState("connecting");
    setTimeout(() => setCallState("connected"), 2200);
  }

  function back() {
    if (activeItem) {
      setActiveItem(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onClose();
    }
  }

  const activeCategory = categories.find((c) => c.category === selectedCategory);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="training-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex flex-col bg-bg"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 overflow-y-auto px-5 py-6 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={back}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink active:scale-95"
                aria-label="Back"
              >
                <Icon name="arrow-left" size={20} />
              </button>
              <h1 className="text-2xl font-extrabold text-ink">Training Center</h1>
            </div>

            {!selectedCategory && (
              <div className="flex flex-col gap-3">
                {categories.map((c) => (
                  <button
                    key={c.category}
                    onClick={() => setSelectedCategory(c.category)}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-4 text-left shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cat-yellow/15 text-cat-yellow">
                        <Icon name={CATEGORY_ICON[c.category] ?? "video"} size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-ink">{c.category}</p>
                        <p className="text-xs text-ink-dim">
                          {c.items.length} lesson{c.items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Icon name="chevron" className="text-ink-dim" size={20} />
                  </button>
                ))}
              </div>
            )}

            {activeCategory && !activeItem && (
              <div className="flex flex-col gap-3">
                {activeCategory.items.map((item) => (
                  <button
                    key={item.content_id}
                    onClick={() => openItem(item)}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-4 text-left shadow-lg"
                  >
                    <div>
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="text-xs text-ink-dim">
                        {item.duration_min} min · {item.language.slice(0, 2).toUpperCase()}
                      </p>
                    </div>
                    <Icon name="play" className="text-cat-yellow" size={20} />
                  </button>
                ))}
              </div>
            )}

            {activeItem && (
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
                      <p className="text-sm font-semibold text-ink">{activeItem.title}</p>
                      <p className="text-xs text-ink-dim">
                        {activeItem.duration_min} min · {activeItem.language.toUpperCase()}
                      </p>
                    </>
                  )}
                  {videoState === "playing" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex w-full max-w-[220px] flex-col items-center gap-3"
                    >
                      <p className="text-sm font-medium text-ink-dim">Playing "{activeItem.title}"…</p>
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
                      <p className="text-sm font-semibold text-ink">Watched — {activeItem.title}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mx-auto w-full max-w-2xl px-5 pb-6">
            <motion.button
              onClick={callOfficer}
              whileTap={{ scale: 0.97 }}
              disabled={callState !== "idle"}
              className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-attention/30 bg-attention/10 text-base font-bold text-ink"
            >
              <AnimatePresence mode="wait">
                {callState === "idle" && (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Icon name="phone" size={18} className="text-attention" /> Emergency Call
                  </motion.span>
                )}
                {callState === "connecting" && (
                  <motion.span
                    key="connecting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-info"
                  >
                    <motion.span
                      className="h-2.5 w-2.5 rounded-full bg-info"
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    />
                    Connecting…
                  </motion.span>
                )}
                {callState === "connected" && (
                  <motion.span
                    key="connected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-success"
                  >
                    <Icon name="check" size={18} /> Connected to Officer Rao
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
