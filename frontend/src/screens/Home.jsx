import { motion } from "framer-motion";
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
export default function Home({ now = defaultNow, onOpenTask, onOpenTraining }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-medium text-ink-dim">{hhmm()} · Zone A Site</p>
          <h1 className="text-2xl font-extrabold text-ink">Good morning, {operator.name.split(" ")[0]}</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-cat-yellow">
          <Icon name="zap" size={20} />
        </div>
      </div>

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

      {next && (
        <>
          <p className="px-1 text-xs font-bold uppercase tracking-widest text-ink-dim">Next</p>
          <motion.button
            onClick={() => onOpenTask(next)}
            whileTap={{ scale: 0.985 }}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface p-4 text-left shadow-lg"
          >
            <div>
              <p className="font-bold text-ink">{next.task_name}</p>
              <p className="text-xs font-medium text-ink-dim">{next.zone} · starts {next.scheduled_start}</p>
            </div>
            <Icon name="chevron" className="text-ink-dim" size={20} />
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
                onClick={() => (t.zone === "Training Hub" ? onOpenTraining() : onOpenTask(t))}
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
