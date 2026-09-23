# CAT Operator AI Companion — Demo-First Plan (v5: Bob the Builder + Real ML + Data Schema)

**Status:** Presenting tomorrow 8 AM. This revision makes three changes to v3 only — mascot identity, ML approach for ETA/behavior detection, and a concrete synthetic data schema — no feature is added or removed.
**Strategy confirmed:** ~50% demo polish / 50% real implementation. Where a full pipeline and a scoped-down version produce the *same visible output*, build the scoped-down version.

**What changed from v3, specifically:**
1. Mascot is now **Bob the Builder** (working name — see note in §7) instead of a generic blob/orb.
2. Task-time ETA and unusual-behavior/idle detection now run on **real trained scikit-learn / XGBoost models** instead of hand-tuned formulas and threshold rules.
3. §9 now specifies the **exact tables and columns** to build tonight — a small, named set of CSVs/JSON tables instead of a single flat spreadsheet — so the two ML models have real features to train on and the schema doubles as the API contract between frontend/backend/ML.

Everything else in v3 — scope, tags, cuts, demo script, dev plan — is unchanged.

---

## 1. Feature Triage — unchanged tagging system, two rows updated

- ✅ **REAL** — fully working, real logic end to end
- ⚙️ **REAL (lightweight)** — genuinely real and working, but deliberately simple (a small trained model, single API call, or threshold instead of a full production pipeline)
- 🎬 **SCRIPTED** — correct and convincing for the demo's specific path, but not backed by general logic
- ❌ **CUT** — not attempted tonight

| Feature | Tag | Why |
|---|---|---|
| Mascot (Bob the Builder) + animation | ✅ REAL | Stated #1 priority — build it properly, it's cheap relative to its payoff |
| Multilingual voice (Gemini) | ⚙️ REAL (lightweight) | Real Gemini calls, scoped to 2–3 demo languages and pre-tested phrases, each with a hardcoded fallback in case a live call is slow mid-demo |
| Daily dashboard (NOW/NEXT/LATER) | ✅ REAL | Just a UI reading your small hand-built dataset — no reason to fake it |
| Seatbelt / proximity alerts | ⚙️ REAL (lightweight) | Simple threshold rules, not ML — deliberately kept deterministic because a safety trigger must never wait on or depend on a model |
| Incident logging + summary | ⚙️ REAL (lightweight) | One real Gemini call summarizing one triggered event, not a general auto-capture system |
| "Why Are You Waiting?" — ask + capture | ✅ REAL | Cheap UI + stored state, high visible payoff |
| "Why Are You Waiting?" — future-downtime learning | 🎬 SCRIPTED | Show one pre-written example of the insight; real pattern-mining needs days of data you don't have tonight |
| "Remember Where I Left Off" | ✅ REAL | Just stored progress/notes — cheap to make genuinely real |
| **Dynamic ETA** | ⚙️ **REAL (lightweight, ML)** | **Changed from v3.** A real scikit-learn/XGBoost regression model, trained tonight on an expanded version of your golden dataset — not a hardcoded formula. Still "lightweight" because the training set is small and features are limited, not because the model is fake. Wrapped with the same hardcoded-fallback safety net used for the Gemini calls. |
| **Unsafe-behavior / idle detection** | ⚙️ **REAL (lightweight, ML)** | **Changed from v3.** A real trained scikit-learn model (Isolation Forest for anomaly flags, or a simple classifier over idle/load-cycle features) instead of pure if/else thresholds. Same fallback safety net applies. |
| Training hub | ⚙️ REAL (lightweight) | One real short video + 1–2 real Gemini Q&A exchanges + a "Call Officer" button that's UI-only (connecting animation, no real telephony needed) |
| "Coach, not surveillance" tone | ✅ REAL | Free — it's wording, not engineering |
| Fatigue-risk signal | ❌ CUT | Not an official requirement, not one of your named differentiators — pure added scope for tonight |
| Offline-first / sync engine | ❌ CUT | Real infrastructure cost; also genuinely risky to demo live. Mention it as an architecture answer if asked — don't build it |
| CV/PPE detection, predictive maintenance, tamper-resistance | ❌ CUT | Already future-only in v2, no change |
| Large 10-table synthetic dataset | ❌ CUT → replaced | Golden demo shift (§9), now paired with a small expanded training set for the two ML models — still not the full v2 ecosystem |
| Full FastAPI + Postgres + WebSocket real-time backend | ❌ CUT → replaced | Minimal setup (§8) — same visible output, a fraction of the build time |

**Net effect:** same as v3 — every official required outcome and every named differentiator is still in. The only change is that two features that were "simulated realism" (formula, thresholds) are now genuinely backed by trained models, which is a stronger, truer answer if a judge asks "is this really ML?" — and it costs very little extra time because the dataset and demo script were already designed around exactly these two features.

---

## 2. Problem Statement — unchanged

Build a multi-functional, intelligent operator companion for CAT machines covering: daily task dashboard, safety features (seatbelt, proximity, incident logging), an operator training hub, unusual-behavior detection, and task time estimation. Sample dataset is inspiration only.

## 3. What We Must Deliver — tonight's checklist

- [ ] Daily task dashboard — ✅ REAL
- [ ] Seatbelt + proximity alerts — ⚙️ REAL (lightweight)
- [ ] Incident logging + summary — ⚙️ REAL (lightweight)
- [ ] Training hub (1 video + Q&A + Call Officer) — ⚙️ REAL (lightweight)
- [ ] Unusual-behavior / idle detection — ⚙️ REAL (lightweight, ML)
- [ ] Task time estimation, real trained model — ⚙️ REAL (lightweight, ML)
- [ ] One small golden dataset + expanded training set — ✅ REAL
- [ ] One rehearsed, end-to-end demo story — still your single most important deliverable

## 4. Who We're Designing For — unchanged, still the whole point

Operator, not well-educated, doesn't know how to operate the application, hands busy, eyes on the job, possibly limited reading fluency, more comfortable in a regional language, wary of surveillance. Default to icon, color, sound, and voice; text is a fallback, never the primary channel.

## 5. Our Idea — unchanged

A voice-enabled, multilingual companion that turns machine, task, safety, and environmental data into simple, in-the-moment guidance instead of a dashboard to interpret. Home screen: NOW / NEXT / LATER. Every important number can answer "Why?" in one plain sentence.

---

## 6. Key Differentiating Features — Scoped for Tonight

**6.1 Mascot ("Bob") + Animation — the centerpiece.** See §7 for concrete build guidance and naming note.

**6.2 Multilingual Voice.** Unchanged from v3 — pick 2–3 languages for the demo, script the exact phrases, test every one live beforehand, hardcoded fallback per phrase.

**6.3 "Why Are You Waiting?"** Unchanged from v3 — idle prompt can be manually/scriptedly triggered in the demo, the mascot asks, the operator taps a reason, it's logged. The "reduces future downtime" payoff stays one scripted line.

**6.4 "Remember Where I Left Off."** Unchanged from v3 — genuinely built, stored progress state, high-polish "resuming task" card.

**6.5 Dynamic ETA — now a real trained model.**
- Train a small regression model (scikit-learn `LinearRegression`/`RandomForestRegressor`, or XGBoost if the team is more comfortable with it) on the expanded golden dataset (§9), using features like task type, idle minutes so far, load cycles completed, and weather/ground condition.
- The model predicts remaining time given the current state, replacing v3's fixed-weight formula — the visible behavior (ETA changes at 2–3 scripted moments, each explained in one sentence) stays exactly the same for the demo.
- **Safety net, same pattern as the Gemini calls:** if the model's prediction at a scripted moment falls outside a sane, pre-checked range, fall back to a hardcoded ETA for that moment. This means the model is genuinely doing the work, but a live demo never shows a nonsense number.
- Train and sanity-check this once, well before the demo, against the exact scripted moments — don't rely on it improvising live.

**6.6 Unsafe-behavior / idle detection — now a real trained model.**
- Train a lightweight scikit-learn model (Isolation Forest for "does this look like an anomaly," or a simple classifier if you'd rather predict a category) on the expanded dataset's idle-time, load-cycle, and seatbelt/proximity features.
- Same safety net as above: the scripted demo moment is checked against the trained model beforehand so it reliably flags what it's supposed to flag live; a hardcoded fallback exists for that one moment in case the model's live output ever drifts.
- Seatbelt and proximity alerts themselves **stay deterministic threshold rules** (unchanged from v3) — those are safety-critical and must never depend on model latency or ambiguity. Only the *unusual-pattern* layer (idling/behavior trend) is ML-based.

**6.7 Training Hub.** Unchanged from v3 — one real short video, 1–2 rehearsed voice Q&A exchanges, "Call Officer" button with a connecting animation. Don't build a content library tonight.

**6.8 Fatigue signal — cut.** Unchanged from v3 — not an official outcome, not a named differentiator; mention it verbally as a roadmap idea if it comes up.

**6.9 Offline-first — cut, keep the answer.** Unchanged from v3: *"Safety-critical detection is designed to run on-device so it never depends on a live connection — that's an architecture decision, not something we needed to build out for tonight's demo."*

---

## 7. UX/UI Implementation — the main event

### Mascot — "Bob the Builder," concretely

**Naming note first:** "Bob the Builder" is being used here as the team's internal working name for a friendly, hard-hat-wearing construction mascot. If this is presented publicly or the deck/app goes beyond the hackathon room, worth a quick internal check on whether to keep that exact name or reskin to an original name — "Bob," "Cat Bob," or a fully original name — since Bob the Builder is an existing licensed children's character and you don't want a trademark question distracting from an otherwise strong technical pitch. For tonight's build and demo, proceed with the concept below.

- **Shape:** simple and rounded — a soft, simplified construction-worker silhouette (rounded head/body, no fine detail) rather than a detailed character illustration. A small CAT-yellow hard hat is the single most recognizable "Bob" cue — it alone does most of the identity work, so the rest of the shape can stay as minimal as the v3 blob/orb concept for animation speed.
- **Color:** anchor the hard hat and base tone in CAT yellow/black, with the red/yellow/blue severity system layered on top for state — same palette rule as v3, just applied to a construction-worker silhouette instead of an abstract orb.
- **States to actually build:** Normal (idle breathing animation, hard hat slightly bobbing), Listening (a subtle pulse/glow around the hard hat or a raised-hand gesture), Warning/Critical (color shift + faster pulse + tone), Coaching/Complete (a small celebratory bounce, e.g. a thumbs-up or tool-raise). Still 4 states — enough to carry the whole demo script, unchanged from v3.
- **How to build it fast:** React + **Framer Motion** + a simple layered SVG (hard hat shape + simplified body/face shape as separate elements so they can animate independently — e.g., hat bob, eye blink, body pulse). Animate scale (breathing), a color fill (severity), and simple eye/hat changes. This stays a few focused hours of work; the extra hard-hat layer adds minimal build time over the plain orb.
- **Sound:** unchanged from v3 — a soft chime on "listening," a distinct tone on "critical," a few audio files and a playback call.
- If someone on the team is fast in Figma/After Effects and has spare time, a Lottie animation (via a Lottie player) is a nice upgrade for "Bob" specifically — but don't learn it from scratch tonight if nobody already knows it.

### Zero-onboarding design
Unchanged from v3. The app opens directly to the NOW screen; Bob greets the operator by voice immediately ("Good morning! Here's your first task.") in their set language. No login flow, no settings screen, no tutorial shown live — the greeting *is* the onboarding.

### Cheap visual-polish wins (no extra engineering time)
Unchanged from v3: one consistent font (Inter or Poppins), consistent rounded corners + soft shadows, one consistent color palette (CAT yellow/black + severity red/yellow/blue), smooth 200–400 ms transitions everywhere.

### Carried forward from v2/v3, now more important than ever
- Icon + color before text, everywhere
- 3-tap rule from the home screen; anything urgent is 1 tap or 1 voice command
- Big touch targets, high contrast for glare
- The app stays quiet during "active operation" — only critical alerts interrupt

---

## 8. Tech Stack — leaned out, ML added back in (lightweight)

| Layer | Tonight's choice | Change from v3 |
|---|---|---|
| Frontend | React + Tailwind + **Framer Motion** | Unchanged |
| Mascot assets | Layered SVG (hard hat + body/face) | New sub-note only — same tooling as v3, just a "Bob" shape instead of a plain orb |
| Voice | Browser Web Speech API only | Unchanged |
| AI (language) | Gemini API for 2–3 real calls (translation, one voice Q&A, one incident summary) — every call wrapped with a hardcoded fallback | Unchanged |
| **ML models** | **scikit-learn (and/or XGBoost) — a small regression model for ETA, an Isolation Forest or simple classifier for unusual-behavior/idle flags. Trained once, locally, on the expanded dataset (§9), well before the demo. Every prediction used live is wrapped with the same hardcoded-fallback pattern as the Gemini calls.** | **Changed from v3.** v3 used deterministic formulas/thresholds here; this version trains real, small models instead — same visible behavior, genuinely backed by ML, same demo-safety guarantee via fallback |
| Backend | The smallest thing that works — a tiny FastAPI service (or a static JSON file) serving your golden dataset in sequence, plus the Gemini calls and the two model predictions | Same shape as v3, now also loads/calls the two trained models |
| Real-time updates | A manual "advance scene" trigger (button/keypress), not WebSockets | Unchanged — you still control pacing live |
| Database | None — in-memory or a single JSON file | Unchanged |
| Deployment | Run locally if that removes risk; deploy only if the hackathon requires a live URL | Unchanged |

---

## 9. Revised Synthetic Data Schema — tables to include tonight

Still small, still hand-buildable in a spreadsheet — not v2's 10-table production ecosystem — but named and structured as real tables instead of one flat sheet, because the ML models (§6.5, §6.6) need actual feature columns to train on, and a named schema is also the contract the frontend/backend/ML pieces build against in parallel (§10). **Eight tables**, each scoped to exactly what tonight's features need:

| # | Table | Purpose | Key columns | Row count tonight |
|---|---|---|---|---|
| 1 | `operators.csv` | Who's operating — drives greeting + language | `operator_id`, `name`, `preferred_language` | 1–2 (just the demo operator, plus one for the "different operator resumes" handover moment if you script that) |
| 2 | `machines.csv` | Which machine — mostly a lookup, keeps IDs consistent everywhere else | `machine_id`, `machine_type` | 1 (matches the sample data's `EXC001`) |
| 3 | `tasks.csv` | Drives the NOW/NEXT/LATER dashboard | `task_id`, `machine_id`, `operator_id`, `task_name`, `zone`, `scheduled_start`, `scheduled_end`, `status` (`NOW`/`NEXT`/`LATER`) | 3–5 — enough for a believable daily list, only 1 actually gets played through live |
| 4 | `telemetry.csv` | The core time-series — extends the provided sample columns, and is the **main feature source for both ML models** | `timestamp`, `machine_id`, `operator_id`, `task_id`, `engine_hours`, `fuel_used_l`, `load_cycles`, `idling_time_min`, `seatbelt_status`, `proximity_alert`, `weather_condition`, `ground_condition` | 15–20 golden rows (the exact ones the demo plays back, in order) **+ ~40–60 additional rows**, same columns, built purely to train the models (never shown live) |
| 5 | `idle_events.csv` | Powers "Why Are You Waiting?" and feeds the behavior model | `idle_event_id`, `machine_id`, `operator_id`, `task_id`, `idle_start`, `idle_end`, `duration_min`, `idle_reason_code`, `reason_source` (`OPERATOR_CONFIRMED`/`SYSTEM_INFERRED`) | 1 golden row (the scripted idle moment) + a handful more inside the expanded training rows |
| 6 | `task_checkpoints.csv` | Powers "Remember Where I Left Off" | `task_id`, `checkpoint_time`, `progress_pct`, `cycles_completed`, `notes`, `event_type` (`PAUSE`/`RESUME`/`AUTO_SAVE`), `operator_id` | 1–2 rows — just enough for the one resume card in the script |
| 7 | `safety_events.csv` | Powers the seatbelt/proximity alert + feeds the incident summary | `event_id`, `machine_id`, `operator_id`, `timestamp`, `event_type` (`SEATBELT`/`PROXIMITY`), `severity`, `resolved` | 1 golden row (the scripted safety event) |
| 8 | `training_content.csv` | Powers the training hub | `content_id`, `title`, `language`, `video_url_or_path` | 1 row — the one real short video |

**What each ML model actually reads:**
- **ETA model (§6.5):** trains on `telemetry.csv` — features `task_id`/`task_name` (from `tasks.csv`), `idling_time_min`, `load_cycles`, `weather_condition`, `ground_condition`, `engine_hours`; target is remaining/completion time. This is why `telemetry.csv` needs the expanded 40–60 rows and not just the 15–20 golden ones — a model trained on 15 rows with no variation has nothing to generalize from.
- **Unusual-behavior model (§6.6):** trains on the same `telemetry.csv` (`idling_time_min`, `load_cycles`, `seatbelt_status`, `proximity_alert`) plus `idle_events.csv`. If you want a quick sanity check beyond an unsupervised Isolation Forest, hand-label a handful of the expanded rows as `is_anomalous` (long idle + low cycles + unfastened seatbelt) so a simple classifier has ground truth to check itself against.

**What still plays back live, unchanged from v3:** the golden 15–20 `telemetry.csv` rows plus the single rows in `idle_events.csv`, `task_checkpoints.csv`, and `safety_events.csv` that match the scripted scenes below — nothing from the expanded training rows is ever shown on stage.

| Scene in demo | Table(s) it reads | Data point needed |
|---|---|---|
| Morning greeting | `operators.csv`, `tasks.csv` | Operator name/language, today's task list |
| Task starts | `tasks.csv`, `telemetry.csv` (+ ETA model) | Initial ETA (from your trained model, not a hardcoded formula) |
| Idle moment | `idle_events.csv` | One idle event → mascot asks why → logged reason |
| Weather/condition change | `telemetry.csv` (+ ETA model) | Trigger → ETA recalculates via the model → one-sentence explanation |
| Safety event | `safety_events.csv` | One proximity/seatbelt trigger → alert → one Gemini-summarized incident |
| Task completes | `telemetry.csv` (+ behavior model), `training_content.csv` | Final stats, one behavior insight (from the trained model), one training recommendation |
| Handover | `task_checkpoints.csv` | One "resuming task" card showing saved progress |

**Build note:** this is still eight small spreadsheets/JSON files hand-built or lightly scripted tonight, not a data-generator pipeline. The only new discipline versus v3 is keeping `telemetry.csv` split into "golden" rows (ordered, demo-safe) and "training" rows (varied, never shown) inside the same file or as two clearly-named tabs — everything else stays exactly as easy to build as v3's single sheet.

---

## 10. Development Plan — Tonight

**Before writing more code:** freeze the exact demo script scene-by-scene (§11) and the exact data each scene needs (§9). No new feature ideas past this point — scope is fixed.

**Build window:**
- **2 people → Frontend & Mascot** — one owns the Bob component (hard hat/body layers, animation states + sound), the other owns the core screens (Home, Task+ETA, Safety alert, Idle-reason, Resume card, Training hub) and stitches them into the scripted flow.
- **1 person → Backend-lite & AI/ML** — the smallest service that plays back the golden dataset on cue, makes the 2–3 real Gemini calls (with fallbacks), **and** builds the expanded training set, trains the two scikit-learn/XGBoost models once, and wraps both with the same hardcoded-fallback pattern used for the Gemini calls.

**Protect this time — don't let build eat into it:**
- Run the *entire* demo script start to finish, exactly as you'll present it, at least 3–5 times — including watching what the two trained models actually output at each scripted moment, not just what the formula used to output.
- Freeze all changes (and freeze the trained models — don't retrain in the final hour) well before 8 AM.
- Leave some buffer to actually rest before presenting.

---

## 11. Demo Script — unchanged, still your most important artifact

Good morning greeting (voice, mascot) → today's tasks (NOW/NEXT/LATER) → task starts, initial ETA → idle occurs, mascot asks why, operator answers → condition changes, ETA recalculates and explains why → safety event → mascot explains the alert, incident logged and summarized → task completes → behavior insight → training recommendation (video + voice Q&A, Call Officer shown) → handover/resume card shows saved progress.

## 12. Known Limitations — say these with confidence, don't build them

Fatigue signal, offline sync, CV/PPE detection, predictive maintenance, and tamper-resistance remain named, scoped, future-facing answers — unchanged from v3.

**One addition worth saying out loud, in the same honest spirit as the rest of this doc:** the ETA and unusual-behavior models are real, trained scikit-learn/XGBoost models — not hardcoded — but they're trained tonight on a small, hand-built dataset (tens of rows, not the thousands a production model would see). If a judge asks how it would scale, the honest answer is: *"The architecture and pipeline are real — same approach we'd use in production, just trained on a hackathon-scale dataset tonight. More real operator data is what would take this from a working prototype to production-grade."* That's a stronger, truer answer than either overclaiming production-readiness or downplaying that it's genuinely ML.
