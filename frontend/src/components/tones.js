// Central severity/tone → color mapping used across cards, badges and tiles.
export const TONES = {
  critical: { fg: "#ef4444", bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.35)" },
  attention: { fg: "#ffcd11", bg: "rgba(255,205,17,0.14)", border: "rgba(255,205,17,0.35)" },
  info: { fg: "#3b82f6", bg: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.35)" },
  success: { fg: "#22c55e", bg: "rgba(34,197,94,0.14)", border: "rgba(34,197,94,0.35)" },
  neutral: { fg: "#9aa0ab", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)" },
};

export function tone(name) {
  return TONES[name] ?? TONES.neutral;
}
