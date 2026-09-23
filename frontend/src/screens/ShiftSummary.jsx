import { motion } from "framer-motion";
import MascotBob from "../components/MascotBob";
import StatTile from "../components/StatTile";
import Icon from "../components/Icon";
import { shift_summary, bob_captions } from "../mockData";

export default function ShiftSummary({ onOpenTraining }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <MascotBob state="coaching" size={130} showCaption={false} />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-success">End of Shift</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink">{bob_captions.complete}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shift_summary.stats.map((s) => (
          <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="rounded-2xl border border-info/25 bg-info/10 p-4">
        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-info">
          <Icon name="zap" size={14} /> Behavior Insight
        </p>
        <p className="text-sm leading-relaxed text-ink">{shift_summary.behavior_insight}</p>
      </div>

      <button
        onClick={onOpenTraining}
        className="flex items-center gap-3 rounded-2xl border border-cat-yellow/25 bg-cat-yellow/10 p-4 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cat-yellow/20 text-cat-yellow">
          <Icon name="video" size={20} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-cat-yellow">Recommended</p>
          <p className="text-sm font-semibold text-ink">{shift_summary.training_recommendation}</p>
        </div>
        <Icon name="chevron" size={18} className="text-ink-dim" />
      </button>
    </div>
  );
}
