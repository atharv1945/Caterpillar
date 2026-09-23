import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressRing from "../components/ProgressRing";
import ProgressBar from "../components/ProgressBar";
import AnimatedNumber from "../components/AnimatedNumber";
import Icon from "../components/Icon";
import SeverityBadge from "../components/SeverityBadge";

export default function TaskDetail({ task, recommendation }) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <SeverityBadge level="info" text={task.zone} />
        {task.weather_condition && task.weather_condition !== "Clear" && (
          <SeverityBadge level="attention" text={`${task.weather_condition} · ${task.ground_condition}`} />
        )}
        {task.progress_pct >= 100 && <SeverityBadge level="success" text="Complete" />}
      </div>

      <h1 className="text-3xl font-extrabold text-ink">{task.task_name}</h1>
      <p className="text-sm font-medium text-ink-dim">{task.scheduled_start} – {task.scheduled_end}</p>

      <div className="glass flex flex-col items-center gap-4 rounded-3xl border border-white/10 p-6 shadow-2xl">
        <ProgressRing
          value={task.progress_pct}
          label={<AnimatedNumber value={task.eta_min} className="text-2xl font-bold text-ink" />}
          sub={task.progress_pct >= 100 ? "done" : "min remaining"}
          size={150}
          color={task.progress_pct >= 100 ? "#22c55e" : "#ffcd11"}
        />
        <ProgressBar value={task.progress_pct} color={task.progress_pct >= 100 ? "#22c55e" : "#ffcd11"} className="w-full" />
        <div className="flex w-full justify-between text-sm">
          <span className="font-semibold text-ink">
            <AnimatedNumber value={task.progress_pct} />% complete
          </span>
          <span className="font-medium text-ink-dim">Live ETA</span>
        </div>
      </div>

      <button
        onClick={() => setShowWhy((v) => !v)}
        className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-4 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="clipboard" size={18} className="text-cat-yellow" /> Why this ETA?
        </span>
        <motion.span animate={{ rotate: showWhy ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <Icon name="chevron-down" size={18} className="text-ink-dim" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {showWhy && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="-mt-3 overflow-hidden rounded-2xl bg-surface-2 px-4"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={task.why}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="py-4 text-sm leading-relaxed text-ink-dim"
              >
                {task.why}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs font-medium text-ink-dim">Load Cycles</p>
          <p className="text-xl font-bold text-ink">
            <AnimatedNumber value={task.load_cycles} />
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="text-xs font-medium text-ink-dim">Idle Time</p>
          <p className="text-xl font-bold text-ink">
            <AnimatedNumber value={task.idling_time_min} /> min
          </p>
        </div>
      </div>

      <AnimatePresence>
        {recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="flex items-center gap-3 rounded-2xl border border-cat-yellow/25 bg-cat-yellow/10 p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cat-yellow/20 text-cat-yellow">
              <Icon name="video" size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cat-yellow">Recommended Next</p>
              <p className="text-sm font-semibold text-ink">{recommendation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
