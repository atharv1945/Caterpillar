import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { operators, tasks } from "../mockData";
import Icon from "../components/Icon";
import ProgressBar from "../components/ProgressBar";
import AnimatedNumber from "../components/AnimatedNumber";

const defaultNow = tasks.find((t) => t.status === "NOW");
const next = tasks.find((t) => t.status === "NEXT");
const later = tasks.filter((t) => t.status === "LATER");
const operator = operators[0];

function hhmm() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// `now` is the live-ticking task snapshot from LiveController — Home reflects
// the same running numbers Task Detail shows, so nothing resets on navigation.
//
// Only `now` (TSK001) has real live simulation data behind it. NEXT/LATER
// tasks are schedule placeholders with no live tracking, so they're
// intentionally non-interactive here — tapping one surfaces a small toast
// instead of opening the live TaskDetail view, which would otherwise show
// TSK001's numbers under a different task's name.
export default function Home({
  now = defaultNow,
  isComplete = false,
  showNowCard = true,
  completedTask = null,
  task2Ready = false,
  onStartTask2,
  onOpenTask,
  onOpenTraining,
}) {
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  function showNotStartedToast() {
    setToast("Not started yet");
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1600);
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            key="not-started-toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-6 z-40 -translate-x-1/2 rounded-full border border-white/10 bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-medium text-ink-dim">{hhmm()} · Zone A Site</p>
          <h1 className="text-2xl font-extrabold text-ink">Good morning, {operator.name.split(" ")[0]}</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-cat-yellow">
          <Icon name="zap" size={20} />
        </div>
      </div>

      {showNowCard ? (
        <>
          <p className="px-1 text-xs font-bold uppercase tracking-widest text-ink-dim">Now</p>
          <motion.button
            onClick={() => onOpenTask(now)}
            whileTap={{ scale: 0.985 }}
            className="glass relative overflow-hidden rounded-3xl border border-cat-yellow/25 p-5 text-left shadow-2xl"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cat-yellow/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cat-yellow/15 px-3 py-1 text-xs font-bold text-cat-yellow">
                  {now.zone}
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-ink">{now.task_name}</h2>
                <p className="text-sm text-ink-dim">{now.scheduled_start} – {now.scheduled_end}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-3xl font-extrabold text-cat-yellow leading-none">
                  <AnimatedNumber value={now.eta_min} /><span className="text-base font-semibold text-ink-dim"> min</span>
                </p>
                <p className="text-xs font-medium text-ink-dim">ETA left</p>
              </div>
            </div>

            <div className="relative mt-5 flex items-center gap-3">
              <ProgressBar value={now.progress_pct} className="flex-1" />
              <span className="text-sm font-bold text-ink">
                <AnimatedNumber value={now.progress_pct} />%
              </span>
            </div>
          </motion.button>
        </>
      ) : (
        <>
          <p className="px-1 text-xs font-bold uppercase tracking-widest text-ink-dim">Now</p>
          <div className="glass flex flex-col items-center gap-2 rounded-3xl border border-white/10 p-6 text-center shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
              <Icon name="check" size={20} />
            </div>
            <p className="text-sm font-semibold text-ink">No active task right now</p>
            <p className="text-xs text-ink-dim">Today's excavation task is complete — nice work.</p>
          </div>
        </>
      )}

      {isComplete && completedTask && (
        <>
          <p className="px-1 text-xs font-bold uppercase tracking-widest text-ink-dim">Completed Today</p>
          {/* Not tappable — LiveController's "task" screen always shows
              whichever task is currently live, so routing this into it would
              show the wrong task once Task 2 has started. */}
          <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-success/5 p-4">
            <div>
              <p className="font-bold text-ink">{completedTask.task_name}</p>
              <p className="text-xs font-medium text-ink-dim">{completedTask.zone} · {completedTask.progress_pct}% complete</p>
            </div>
            <Icon name="check" className="text-success" size={20} />
          </div>
        </>
      )}

      {next && !(isComplete && showNowCard) && (
        <>
          <p className="px-1 text-xs font-bold uppercase tracking-widest text-ink-dim">Next</p>
          <motion.button
            onClick={task2Ready ? onStartTask2 : showNotStartedToast}
            whileTap={{ scale: 0.985 }}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left shadow-lg ${
              task2Ready ? "border-cat-yellow/40 bg-cat-yellow/10" : "border-white/10 bg-surface"
            }`}
          >
            <div>
              <p className="font-bold text-ink">{next.task_name}</p>
              <p className="text-xs font-medium text-ink-dim">{next.zone} · starts {next.scheduled_start}</p>
            </div>
            {task2Ready ? (
              <span className="shrink-0 rounded-full bg-cat-yellow px-3 py-1.5 text-xs font-extrabold text-cat-black">
                Ready to start
              </span>
            ) : (
              <Icon name="chevron" className="text-ink-dim" size={20} />
            )}
          </motion.button>
        </>
      )}

      {later.length > 0 && (
        <>
          <p className="px-1 text-xs font-bold uppercase tracking-widest text-ink-dim">Later</p>
          <div className="flex flex-col gap-2">
            {later.map((t) => (
              <button
                key={t.task_id}
                onClick={() => (t.zone === "Training Hub" ? onOpenTraining() : showNotStartedToast())}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface-2/60 px-4 py-3 text-left transition-colors hover:border-white/15"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-ink-dim">
                    <Icon name={t.zone === "Training Hub" ? "video" : "layers"} size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.task_name}</p>
                    <p className="text-xs text-ink-dim">{t.zone} · {t.scheduled_start}</p>
                  </div>
                </div>
                <Icon name="chevron" className="text-ink-dim" size={18} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
