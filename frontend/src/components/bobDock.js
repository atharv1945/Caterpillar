// Shared constants so the intro's final resting position and the persistent
// dock are pixel-identical — that's what lets the layoutId handoff between
// them read as one continuous Bob instead of a jump between two mascots.
export const BOB_DOCK_LAYOUT_ID = "bob-dock-avatar";
export const BOB_DOCK_SIZE = "clamp(112px, 33vw, 260px)";
export const BOB_DOCK_BOTTOM = 80; // px — clears the hidden dev corner + safe area
export const BOB_DOCK_RIGHT = 16; // px
