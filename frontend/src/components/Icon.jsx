// Minimal hand-built icon set — no external icon package needed for the demo.
// All icons share a 24x24 viewBox, stroke-based, currentColor.

const paths = {
  truck: (
    <>
      <rect x="1" y="7" width="14" height="9" rx="1.5" />
      <path d="M15 10h4l3 3v3h-2" />
      <circle cx="6" cy="18.5" r="1.8" />
      <circle cx="17" cy="18.5" r="1.8" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2.5" width="6" height="3" rx="1" />
      <path d="M8.5 11h7M8.5 15h7" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5l-6.8 6.8a1.6 1.6 0 0 0 2.3 2.3l6.8-6.8a4 4 0 0 0 5-5.4l-2.6 2.6-2-2z" />
  ),
  "cloud-rain": (
    <>
      <path d="M6.5 17a4.5 4.5 0 0 1 .7-8.9 5.5 5.5 0 0 1 10.5 1.6A3.8 3.8 0 0 1 17 17H6.5z" />
      <path d="M8 20l-1 2M12 20l-1 2M16 20l-1 2" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 8h13v5.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
      <path d="M17 9.5h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M7 3.5c0 1-1 1-1 2M11 3.5c0 1-1 1-1 2" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5M3 8.5v5M21 8.5v5" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1.2" />
      <rect x="14" y="4" width="4" height="16" rx="1.2" />
    </>
  ),
  "alert-triangle": (
    <>
      <path d="M12 3.5L2 20.5h20L12 3.5z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="17.3" r="0.15" fill="currentColor" />
    </>
  ),
  "shield-alert": (
    <>
      <path d="M12 2.5l8 3.2v6c0 5-3.4 8.6-8 9.8-4.6-1.2-8-4.8-8-9.8v-6l8-3.2z" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.15" fill="currentColor" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </>
  ),
  phone: (
    <path d="M5 4h3.5l1.5 4.5-2 1.5a13 13 0 0 0 6.5 6.5l1.5-2 4.5 1.5V19a2 2 0 0 1-2.2 2C10.8 20.4 3.6 13.2 3 6.2A2 2 0 0 1 5 4z" />
  ),
  play: <path d="M7 4.5l13 7.5-13 7.5v-15z" />,
  chevron: <path d="M8 5l7 7-7 7" />,
  "chevron-down": <path d="M5 8l7 7 7-7" />,
  "arrow-right": <path d="M4 12h15M13 6l6 6-6 6" />,
  "arrow-left": <path d="M20 12H5M11 18l-6-6 6-6" />,
  x: <path d="M5 5l14 14M19 5L5 19" />,
  video: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2" />
      <path d="M15.5 10l6-3.5v11l-6-3.5" />
    </>
  ),
  fuel: (
    <>
      <path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15" />
      <path d="M4 12h8" />
      <path d="M14 8l3 2.5v6.5a1.5 1.5 0 0 0 3 0V9.5L17.5 6.5" />
    </>
  ),
  zap: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
  send: <path d="M4 12l16-8-6 16-3-6-7-2z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
};

export default function Icon({ name, size = 24, className = "", strokeWidth = 2, filled = false }) {
  const content = paths[name];
  if (!content) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {content}
    </svg>
  );
}
