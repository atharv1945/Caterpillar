import { tone } from "./tones";

const LABELS = {
  critical: "🚨 Critical",
  attention: "⚠ Attention",
  info: "💡 Info",
  success: "✅ Done",
};

export default function SeverityBadge({ level = "info", text }) {
  const c = tone(level);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
    >
      {text ?? LABELS[level]}
    </span>
  );
}
