import Icon from "./Icon";
import { tone } from "./tones";

export default function StatTile({ icon, label, value, tone: toneName = "neutral" }) {
  const c = tone(toneName);
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl border border-white/10 p-4 shadow-lg">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: c.bg, color: c.fg }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-ink leading-tight">{value}</div>
        <div className="text-xs font-medium text-ink-dim">{label}</div>
      </div>
    </div>
  );
}
