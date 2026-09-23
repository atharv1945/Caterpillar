# Scene/State API Contract — Revision 2 (elapsed-driven, stateless)

**Written for:** whoever implements the backend scene/state endpoint(s). This supersedes any earlier `/scene/advance` + `/scene/current` design — that design assumed the backend owned a clock and tracked "current scene." It doesn't, and it shouldn't.

## Why this changed

The frontend does not run scene indices and does not sync a clock with the backend. `LiveController.jsx` owns a single local integer, `elapsed` (seconds since live-mode started), and derives every number and every triggered event on screen from it via pure interpolation (`timeline.js`). The backend is needed for **data**, not for **timing or orchestration**. Concretely:

- The frontend increments `elapsed` itself once per second via `setInterval`, and pauses it locally whenever an overlay is waiting on the operator (idle sheet, critical alert, chat open).
- Idle detection, the weather/ETA recalculation, the safety event, and task completion are all just `elapsed >= <threshold>` checks running in the browser. The backend never decides "advance to the next scene" — it never even knows a scene changed until it's asked.
- Because of this, `/scene/advance` and `/scene/current` have nothing to authoritatively track. Remove them as time-authorities. Do not build a server-side ticker to replace them.

## The endpoint

```
GET /scene/payload?elapsed=<seconds>
```

- `elapsed` (required, integer ≥ 0): the frontend's own current `elapsed` value, sent fresh on every call. The backend does not store or increment this.
- `scene_name` (optional): if the frontend ever wants to pass it explicitly it can, but the backend should be able to infer it from `elapsed` alone, using the ranges below — these must match the frontend's actual keyframes in `timeline.js`, not an independent guess:

| `elapsed` range (sec) | `scene_name` | Frontend constant |
|---|---|---|
| 0 – 17 | `task_start` | before `IDLE_TRIGGER_T` |
| 18 – 25 | `idle_moment` | `IDLE_TRIGGER_T = 18` → idle begins accumulating |
| 26 – 33 | `idle_moment` (post-threshold / ack) | `IDLE_THRESHOLD_T = 26` → sheet auto-opens on frontend |
| 34 – 57 | `condition_change` | weather flips to Rain/Muddy at `elapsed >= 30`; ETA settles into its post-rain trajectory by ~34 |
| 58 – 89 | `safety_event` | `SAFETY_T = 58` |
| 90+ | `complete` | `COMPLETE_T = 90` (frontend auto-advances to training/handover screens itself, from here) |

Every call is **stateless**: the same `elapsed` value must always return the same payload (see the one exception below). No server-side clock, no session-scoped "current scene" pointer, no requirement that calls arrive in order or without gaps — the frontend may call with `elapsed=40` having never called `elapsed=39`, e.g. after the hidden recovery shortcut force-jumps the clock.

## `assemble_scene_payload()` — unchanged

Keep this function and all of Phase 1–5 exactly as designed (ML ETA lookup, Gemini call, CSV joins, fallback wrapping, etc.). The only thing that changes is what *calls* it: instead of being invoked by a server-side ticker or a `/scene/advance` POST, it's invoked once per `GET /scene/payload` request, parameterized by the `elapsed`/`scene_name` from the query string.

## `POST /scene/reset` — keep only if there's real server-side state

`resetAll()` on the frontend is a purely local state reset (zeroes `elapsed`, closes overlays, flips `phase` back to `"intro"`) and needs nothing from the backend. Only keep a reset endpoint if the backend holds mutable state that isn't derivable from `elapsed` alone — e.g. a "has this idle event already been given a reason" flag that changes the wording of a later incident summary. If no such flag exists, delete this endpoint entirely.

## Data alignment (idle_events.csv / safety_events.csv)

Timestamps in these tables should represent the same moments as the frontend's keyframes, so payload text stays consistent with the numbers on screen at that `elapsed` value:

- **Idle event window:** in-fiction, this represents the operator being idle for ~5 minutes, which the frontend maps onto real `elapsed` 18→26s (interpolating `idling_time_min` from 0 to 5 over that window, then holding at 5). The idle event row's duration/description should reflect "5 minutes idle," not "8 seconds."
- **Safety/critical event:** occurs at `elapsed = 58`. The event row's timestamp should correspond to whatever in-fiction clock time you're using for the rest of the shift narrative, but the *payload* returned for `elapsed` in `[58, 90)` must reflect this event as already-triggered/current.

## ML / Gemini integration — unchanged

No changes to how models are called or to the hardcoded-fallback pattern (`getValueOrFallback` on the frontend mirrors whatever wrapper Phase 1–5 uses server-side). They're just invoked from an elapsed-driven lookup instead of a scene-index lookup — same calls, same fallback safety net, different trigger.

## Verification

I can't hit a live endpoint from here (no backend code exists in this repo yet), so treat this as the acceptance check to run once it's implemented — call `GET /scene/payload` at each of these and confirm the response matches:

- **`elapsed=0`** → `scene_name: task_start`; ~8% progress, ETA ~58min, Clear/Dry, 0 idle minutes.
- **`elapsed=20`** → `scene_name: idle_moment`; progress/ETA flat-ish near the 25%/52min keyframe, idle minutes partway between 0 and 5 (interpolating).
- **`elapsed=40`** → `scene_name: condition_change`; weather/ground = Rain/Muddy, ETA reflects the post-rain bump, "why" text mentions rain/topsoil.
- **`elapsed=60`** → `scene_name: safety_event`; seatbelt/proximity flagged, ~40% progress, ETA ~46min.
- **`elapsed=95`** → `scene_name: complete`; 100% progress, 0min ETA, behavior-insight text present (through the fallback wrapper if the model output is empty).

Each of these five should return **distinct** payloads — if two adjacent ones look identical, the `elapsed`→`scene_name` mapping or the interpolation inside `assemble_scene_payload()` isn't reading the query param correctly.
