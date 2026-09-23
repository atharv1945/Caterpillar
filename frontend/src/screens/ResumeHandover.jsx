import { motion } from "framer-motion";
import ProgressBar from "../components/ProgressBar";
import Icon from "../components/Icon";
import TypeOnText from "../components/TypeOnText";
import { task_checkpoints, tasks, operators, bob_captions } from "../mockData";

export default function ResumeHandover({ caption, ctaLabel = "Continue Task", onContinue }) {
  const task = tasks.find((t) => t.status === "NOW");
  const pause = task_checkpoints.find((c) => c.event_type === "PAUSE");
  const priorOperator = operators.find((o) => o.operator_id === pause.operator_id);

  return (
    <div className="flex min-h-full flex-col justify-center gap-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-info">Handover</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">
          <TypeOnText text={caption ?? bob_captions.handover} />
        </h1>
      </div>

      <div className="glass rounded-3xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-dim">{task.zone}</p>
            <p className="text-xl font-extrabold text-ink">{task.task_name}</p>
          </div>
          <span className="text-3xl font-extrabold text-cat-yellow">{pause.progress_pct}%</span>
        </div>
        <ProgressBar value={pause.progress_pct} className="mt-4" />

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/20 p-3">
          <Icon name="layers" size={18} className="text-ink-dim" />
          <p className="text-sm font-medium text-ink">{pause.cycles_completed} load cycles completed</p>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-black/20 p-3">
          <Icon name="clipboard" size={18} className="mt-0.5 text-ink-dim" />
          <p className="text-sm text-ink-dim">
            Handed off by <span className="font-semibold text-ink">{priorOperator?.name}</span> at {pause.checkpoint_time}. {pause.notes}
          </p>
        </div>
      </div>

      <motion.button
        onClick={onContinue}
        whileTap={{ scale: 0.97 }}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-cat-yellow text-base font-extrabold text-cat-black shadow-lg"
      >
        {ctaLabel} <Icon name="arrow-right" size={18} />
      </motion.button>
    </div>
  );
}
