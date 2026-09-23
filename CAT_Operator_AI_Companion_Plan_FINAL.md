# CAT Operator AI Companion — Final Plan (v6: Merged Context + Split Backend/ML)

**Status:** This is the single source-of-truth doc for the build. It merges:
- **v2** — full problem context, design rationale, feature detail, dataset architecture, demo story, limitations.
- **v5** — the decisions that superseded v2 where they conflict: mascot identity (Bob the Builder), real trained ML models for ETA and behavior detection (not formulas/thresholds), the concrete 8-table data schema, and the feature triage (what's REAL vs SCRIPTED vs CUT).
- **One new change (this doc):** Backend and ML are now **two separate people**, not one combined "Backend-lite & AI/ML" role. §10 and the new §9.1 exist specifically to make that split work — everything else below is unchanged from v2/v5 except where noted.

**How to use this document:** Everyone on the team feeds this exact file as context into their own Claude conversation, then asks for a phase-by-phase implementation plan scoped to their track. Use the table below to know what to emphasize.

| If you are... | Focus your prompt on | Key sections |
|---|---|---|
| Frontend (either of the 2) | Screens, mascot, voice, demo flow | §4, §6, §7, §10 (Frontend rows), §11 |
| **ML** | Training pipeline, model contract | §5 (6.5/6.6), §9, **§9.1**, §10 (ML row) |
| **Backend** | API/service, Gemini calls, integration | §8, §9, **§9.1**, §10 (Backend row) |
| Whoever's coordinating | The whole thing, especially §9.1 and §10 | All |

---

## 1. Problem Statement

Build a multi-functional, intelligent operator companion for CAT machines — not just a tool, an intelligent companion that supports the operator through the entire workday. It must cover five required outcome areas:

1. Daily task dashboard
2. Real-time safety features — seatbelt compliance, proximity hazards, incident logging (working conditions to be considered)
3. Operator training hub — any creative learning format
4. Unusual machine-usage behavior detection — excessive idling, unsafe operating patterns
5. Task time estimation from historical data and environmental conditions

A sample telemetry table (timestamp, machine ID, operator ID, engine hours, fuel used, load cycles, idling time, seatbelt status, safety alert triggered) is supplied **as inspiration only** — rows/columns can be freely added or removed. We are building a clean, purpose-built dataset rather than cleaning the sample.

---

## 2. Who We're Designing For

The primary user is the **operator**, not a fleet manager or site admin:

- Inside a noisy, vibrating cabin, hands on controls, eyes on the work — not free to read paragraphs or hunt through menus
- Wearing gloves, possibly dealing with sun glare, dust, or rain
- Under time and productivity pressure
- Possibly limited in reading fluency — long text and dense training modules get skipped, not read
- Possibly more comfortable in a regional language than English
- Naturally wary of being monitored — anything that feels like surveillance gets resisted or gamed
- Wants to feel competent and independent, not babysat
- Fatigues over a long shift, which is itself a safety variable

**Design implication carried through everything below: default to icons, color, sound, and voice. Treat text as a fallback, never the primary channel.**

---

## 3. Our Idea — The CAT Operator AI Companion

> A voice-enabled, multilingual companion that turns machine, task, safety, environmental, and historical data into simple, in-the-moment guidance — instead of asking the operator to interpret a dashboard.

**Core loop:**
```
OBSERVE  →  UNDERSTAND  →  PREDICT  →  RECOMMEND  →  LEARN
"idle 18   "42% above     "task will    "want a       (behavior feeds
 min"       your avg,      finish        fuel-saving    back into future
            waiting on     ~10:41"       tip after      predictions &
            trucks"                      this task?"    training)
```

**Home screen model: NOW / NEXT / LATER**
- **NOW** — current task, progress, ETA, one important alert
- **NEXT** — upcoming task, start time, what to know before starting
- **LATER** — training, shift summary, non-urgent recommendations

Every important number the companion shows should be able to answer **"Why?"** in one plain sentence — this single pattern is what makes it feel like a companion instead of a dashboard.

---

## 4. Final Feature Scope — What's Actually Being Built

This table is authoritative. It's v5's triage, carried forward unchanged:

- ✅ **REAL** — fully working, real logic end to end
- ⚙️ **REAL (lightweight)** — genuinely real and working, but deliberately simple
- 🎬 **SCRIPTED** — correct and convincing for the demo's specific path, not backed by general logic
- ❌ **CUT** — not attempted in this build

| Feature | Tag | Why |
|---|---|---|
| Mascot (Bob the Builder) + animation | ✅ REAL | Highest payoff relative to cost |
| Multilingual voice (Gemini) | ⚙️ REAL (lightweight) | Real Gemini calls, scoped to 2–3 languages, pre-tested phrases, hardcoded fallback per phrase |
| Daily dashboard (NOW/NEXT/LATER) | ✅ REAL | Just a UI reading the dataset — no reason to fake it |
| Seatbelt / proximity alerts | ⚙️ REAL (lightweight) | Deterministic threshold rules, not ML — safety triggers must never wait on or depend on a model |
| Incident logging + summary | ⚙️ REAL (lightweight) | One real Gemini call summarizing one triggered event |
| "Why Are You Waiting?" — ask + capture | ✅ REAL | Cheap UI + stored state, high visible payoff |
| "Why Are You Waiting?" — future-downtime learning | 🎬 SCRIPTED | One pre-written example insight; real pattern-mining needs more data than we have |
| "Remember Where I Left Off" | ✅ REAL | Stored progress/notes — cheap to make genuinely real |
| **Dynamic ETA** | ⚙️ **REAL (lightweight, ML)** | Real scikit-learn/XGBoost regression model trained on the expanded dataset (§9) — not a hardcoded formula. Wrapped with a hardcoded-fallback safety net. |
| **Unsafe-behavior / idle detection** | ⚙️ **REAL (lightweight, ML)** | Real trained model (Isolation Forest or simple classifier) over idle/load-cycle features. Same fallback safety net. |
| Training hub | ⚙️ REAL (lightweight) | One real short video + 1–2 real Gemini Q&A exchanges + a "Call Officer" button (UI-only — connecting animation, no real telephony) |
| "Coach, not surveillance" tone | ✅ REAL | Free — it's wording, not engineering |
| Fatigue-risk signal | ❌ CUT | Not an official requirement, not a named differentiator |
| Offline-first / sync engine | ❌ CUT | Real infra cost, risky to demo live. Keep it as an architecture answer if asked |
| CV/PPE detection, predictive maintenance, tamper-resistance | ❌ CUT | Future-only, out of scope |
| Large 10-table synthetic dataset | ❌ CUT → replaced | Golden demo shift + a small expanded training set (§9) — not the full v2 ecosystem |
| Full FastAPI + Postgres + WebSocket real-time backend | ❌ CUT → replaced | Minimal service (§8) — same visible output, a fraction of the build time |

**Checklist:**
- [ ] Daily task dashboard
- [ ] Seatbelt + proximity alerts
- [ ] Incident logging + summary
- [ ] Training hub (1 video + Q&A + Call Officer)
- [ ] Unusual-behavior / idle detection (real trained model)
- [ ] Task time estimation (real trained model)
- [ ] Golden dataset + expanded training set
- [ ] One rehearsed, end-to-end demo story — still the single most important deliverable

---

## 5. Key Differentiating Features

### 5.1 Multilingual, Voice-First Interaction
Operator picks (or the app detects) a preferred language once, stored on their profile. Dynamically generated text (explanations, alert phrasing, training answers) goes through **Gemini** at request time. Voice loop: speech-to-text → Gemini interprets intent + drafts a reply → text-to-speech speaks it back. **Reliability rule:** critical safety phrases are pre-translated/cached for demo languages so a safety alert never waits on a live API call. **Build note:** scoped to 2–3 demo languages, exact phrases scripted and tested ahead of time, every call has a hardcoded fallback.

### 5.2 "Why Are You Waiting?" — Active Idle-Reason Capture
Idle threshold crossed → after a grace period → companion asks, voice-first: *"You've been idle 5 minutes — what's going on?"* Answer is one tap/word from a short list (Waiting for truck/material, Waiting for instructions, Mechanical issue, Weather/site condition, Scheduled break, Other), logged with a timestamp to `idle_events.csv`. Aggregated, this becomes an operational signal ("Zone A logged 40 min idle, 70% waiting on trucks") rather than a performance write-up. The "pattern repeats → pre-empt it" learning loop is demoed as one scripted example line, not built as real pattern-mining.

### 5.3 "Remember Where I Left Off" — Task Memory, Pause & Resume
Every task tracks a running checkpoint: % complete, cycles done, last zone/position, a short note (can be voice-dictated). Auto-saves on pause (operator steps away, idle threshold on an in-progress task, shift ends). On resume — same operator or a different one — the companion gives a short structured briefing instead of a blank screen: *"Resuming Excavation – Zone A. 68% complete, 17 of 25 cycles done. Ground was wet, pace had slowed. Last note: 'holding for grading crew.'"*

### 5.4 Coach, Not Surveillance — Trust by Design
Operator sees their own data first, by default; nothing is quietly collected out of view. Supervisor views default to aggregated, coaching-oriented summaries, not a per-operator "gotcha" feed. Positive reinforcement built in alongside flags. Every recommendation is explainable on request.

### 5.5 Dynamic, Explainable Task ETA — now a real trained model
- Train a small regression model (scikit-learn `LinearRegression`/`RandomForestRegressor`, or XGBoost) on the expanded dataset (§9), using features like task type, idle minutes so far, load cycles completed, weather/ground condition.
- The model predicts remaining time given current state — replaces any fixed-weight formula. Visible behavior for the demo stays the same: ETA changes at 2–3 scripted moments, each explained in one sentence (*"Ground got wet, cycle time increased — 6 minutes added."*).
- **Safety net:** if the model's prediction at a scripted moment falls outside a sane, pre-checked range, fall back to a hardcoded ETA for that moment. The model genuinely does the work; the live demo never shows a nonsense number.
- Train and sanity-check once, well before the demo, against the exact scripted moments — don't rely on it improvising live.
- **Ownership:** this model is entirely the **ML** person's deliverable (see §9.1 for the exact contract handed to Backend).

### 5.6 Unsafe-behavior / Idle Detection — now a real trained model
- Train a lightweight scikit-learn model (Isolation Forest for "is this an anomaly," or a simple classifier) on the expanded dataset's idle-time, load-cycle, and seatbelt/proximity features.
- Same safety net as 5.5: the scripted demo moment is checked against the trained model beforehand; a hardcoded fallback exists for that one moment.
- **Seatbelt and proximity alerts themselves stay deterministic threshold rules** — safety-critical, must never depend on model latency or ambiguity. Only the *unusual-pattern* layer is ML-based.
- **Ownership:** entirely the **ML** person's deliverable.

### 5.7 Operator Training Hub — Decision
**Primary: short (2–5 min) video micro-lesson, in the operator's language, paired with voice AI Q&A.** Video needs no reading fluency; an operator can just ask a question and get a spoken answer. **Safety net: one-tap "Call Officer/Trainer"** for anything the video/AI can't resolve — a real human in the loop, demoable as a logged request/connecting animation rather than a live phone system. **Simulation is not built, only referenced** — CAT already runs simulator training (§12); the hub deep-links out to it instead of duplicating it.

### 5.8 Fatigue Signal, Offline-First — cut, keep the answer
Both are named as deliberate cuts. If asked: *"Safety-critical detection is designed to run on-device so it never depends on a live connection — that's an architecture decision, not something we built out for this pass."* Fatigue: not an official requirement, not a named differentiator, worth mentioning verbally as a roadmap idea only.

---

## 6. UX/UI Implementation

### Mascot — "Bob the Builder," concretely
**Naming note:** "Bob the Builder" is an internal working name for a friendly, hard-hat-wearing construction mascot. If this goes anywhere beyond the hackathon room, do a quick check on keeping that exact name vs. reskinning to something original ("Bob," "Cat Bob," fully original) — Bob the Builder is an existing licensed children's character, and a trademark question is a distraction from an otherwise strong technical pitch. Proceed with the concept below for the build.

- **Shape:** simple, rounded construction-worker silhouette (rounded head/body, no fine detail). A small CAT-yellow hard hat does most of the identity work, so the rest of the shape can stay minimal.
- **Color:** hard hat + base tone in CAT yellow/black, with the red/yellow/blue severity system layered on top for state.
- **States to build:** Normal (idle breathing, hard hat slightly bobbing), Listening (subtle pulse/glow or raised-hand gesture), Warning/Critical (color shift + faster pulse + tone), Coaching/Complete (small celebratory bounce — thumbs-up or tool-raise). Four states carry the whole demo.
- **How to build it fast:** React + **Framer Motion** + a layered SVG (hard hat + simplified body/face as separate elements, animated independently — hat bob, eye blink, body pulse).
- **Sound:** soft chime on "listening," distinct tone on "critical."
- Optional upgrade if someone already knows Lottie: a Lottie animation via a Lottie player — don't learn it from scratch under time pressure.

### Zero-onboarding design
App opens directly to the NOW screen; Bob greets the operator by voice immediately in their set language. No login flow, no settings screen, no tutorial — the greeting *is* the onboarding.

### Cheap visual-polish wins
One consistent font (Inter or Poppins), consistent rounded corners + soft shadows, one consistent color palette (CAT yellow/black + severity red/yellow/blue), smooth 200–400ms transitions everywhere.

### Design rules that apply everywhere
- **Icon + color first, text second.** Severity tiers: 🚨 Critical (red) / ⚠ Attention (yellow) / 💡 Later (blue).
- **Audio matters as much as visuals.** Every critical alert pairs a distinct tone with a spoken alert.
- **Big touch targets, high contrast** — sized for gloved hands, high-contrast for outdoor glare.
- **3-tap rule.** Any core function reachable in 3 taps or fewer from Home; anything urgent is 1 tap or 1 voice command.
- **No-reading fallback for anything safety-critical** — understandable from icon + color + sound + voice alone.
- **The app goes quiet during active hazardous operation.** Only critical-safety interruptions during active machine movement in a hazard zone; everything else waits for a natural pause.

**Core screens:** Home (NOW/NEXT/LATER) · Task detail + live ETA · Full-screen critical safety alert · Idle-reason quick-pick · Resume/handover card · Training hub (video + voice Q&A + Call Officer) · Voice/mascot overlay · End-of-shift summary.

---

## 7. Tech Stack — Final

| Layer | Choice | Owner track |
|---|---|---|
| Frontend framework | React + Tailwind + Framer Motion | Frontend |
| Mascot assets | Layered SVG (hard hat + body/face) | Frontend |
| Voice (STT/TTS) | Browser Web Speech API | Frontend |
| AI (language) | Gemini API — 2–3 real calls (translation, one voice Q&A, one incident summary), each with a hardcoded fallback | Backend |
| ML models | scikit-learn / XGBoost — regression for ETA, Isolation Forest or simple classifier for unusual-behavior/idle. Trained once, locally, well before the demo. Every live prediction wrapped with the hardcoded-fallback pattern. | **ML** |
| Backend service | A minimal FastAPI service serving the golden dataset in sequence, plus Gemini calls and calls into the ML prediction functions | **Backend** |
| Real-time updates | A manual "advance scene" trigger (button/keypress) — not WebSockets, pacing stays presenter-controlled | Backend |
| Database | None required — in-memory or JSON files are enough; a real DB (SQLite/Postgres) is a nice-to-have now that Backend is a dedicated person, not a requirement | Backend |
| Deployment | Run locally if that removes risk; deploy only if a live URL is required | Backend |

---

## 8. Data Schema — Eight Tables (the contract between all tracks)

Small, hand-buildable, but named and structured as real tables because the ML models need real feature columns and this schema is what Frontend/Backend/ML all build against in parallel.

| # | Table | Purpose | Key columns | Rows |
|---|---|---|---|---|
| 1 | `operators.csv` | Who's operating — greeting + language | `operator_id`, `name`, `preferred_language` | 1–2 |
| 2 | `machines.csv` | Which machine, keeps IDs consistent | `machine_id`, `machine_type` | 1 (matches sample `EXC001`) |
| 3 | `tasks.csv` | Drives NOW/NEXT/LATER dashboard | `task_id`, `machine_id`, `operator_id`, `task_name`, `zone`, `scheduled_start`, `scheduled_end`, `status` | 3–5, one played live |
| 4 | `telemetry.csv` | Core time-series; **main feature source for both ML models** | `timestamp`, `machine_id`, `operator_id`, `task_id`, `engine_hours`, `fuel_used_l`, `load_cycles`, `idling_time_min`, `seatbelt_status`, `proximity_alert`, `weather_condition`, `ground_condition` | 15–20 golden rows (played live, in order) **+ 40–60 training rows** (never shown live) |
| 5 | `idle_events.csv` | Powers "Why Are You Waiting?"; feeds behavior model | `idle_event_id`, `machine_id`, `operator_id`, `task_id`, `idle_start`, `idle_end`, `duration_min`, `idle_reason_code`, `reason_source` | 1 golden row + a few inside training rows |
| 6 | `task_checkpoints.csv` | Powers "Remember Where I Left Off" | `task_id`, `checkpoint_time`, `progress_pct`, `cycles_completed`, `notes`, `event_type`, `operator_id` | 1–2 rows |
| 7 | `safety_events.csv` | Powers seatbelt/proximity alert + incident summary | `event_id`, `machine_id`, `operator_id`, `timestamp`, `event_type`, `severity`, `resolved` | 1 golden row |
| 8 | `training_content.csv` | Powers training hub | `content_id`, `title`, `language`, `video_url_or_path` | 1 row |

**Golden vs. training split matters:** `telemetry.csv` needs both the 15–20 ordered "golden" rows the demo plays back and 40–60 varied "training" rows that only the models ever see — a model trained on 15 rows with no variation has nothing to generalize from.

**Demo scene → data mapping:**

| Scene | Table(s) | Data point needed |
|---|---|---|
| Morning greeting | `operators.csv`, `tasks.csv` | Operator name/language, today's task list |
| Task starts | `tasks.csv`, `telemetry.csv` + ETA model | Initial ETA (from the trained model) |
| Idle moment | `idle_events.csv` | One idle event → mascot asks why → logged reason |
| Weather/condition change | `telemetry.csv` + ETA model | ETA recalculates via the model → one-sentence explanation |
| Safety event | `safety_events.csv` | One trigger → alert → Gemini-summarized incident |
| Task completes | `telemetry.csv` + behavior model, `training_content.csv` | Final stats, one behavior insight, one training recommendation |
| Handover | `task_checkpoints.csv` | One "resuming task" card |

**If there's time left over:** v2's original 10-table version (adding `environment.csv`, `task_results.csv`, `training_history.csv`, `escalations.csv`, and a derived `fatigue_risk_score`) is the natural extension path — not required for this build, worth mentioning as a roadmap item.

---

## 9.1 NEW — Integration Contract: Backend ↔ ML (why this section exists)

In v5, one person built both the backend and the ML models together, so the "contract" between them lived in one head and never had to be written down. **Now that Backend and ML are two different people, this has to be explicit and agreed in Phase 0 — before either track starts building — or the two pieces won't integrate cleanly on the night.**

**Recommendation: keep this a same-process function call, not a network hop.** Both pieces are Python; a second microservice for two small models adds deployment risk for no real benefit in this timeframe.

**What ML delivers to Backend:**
- A single importable module (e.g. `ml_models/predict.py`) plus its trained artifacts (`eta_model.joblib`, `behavior_model.joblib`) and a `requirements.txt`.
- Two functions, with a signature Backend can code against **before ML finishes training**:
  - `predict_eta(features: dict) -> {"eta_minutes": float, "source": "model" | "fallback"}`
  - `predict_behavior(features: dict) -> {"is_anomalous": bool, "score": float, "source": "model" | "fallback"}`
- The exact `features` dict keys, matching `telemetry.csv` columns 1:1 (e.g. `idling_time_min`, `load_cycles`, `weather_condition`, `ground_condition`, `engine_hours`, `task_id`) — agreed once in Phase 0, then frozen.
- The fallback logic (sane-range check → hardcoded value for that scripted moment) lives **inside** these functions, so Backend never has to implement or duplicate it — Backend just calls the function and trusts what comes back.
- A short note on which exact golden-dataset rows/scenes each model's output was sanity-checked against, so Backend/Frontend can verify the demo path once integrated.

**What Backend delivers to ML:**
- The finalized `telemetry.csv` schema/column names (from §8) — ML builds the expanded 40–60 training rows against this, so this should be one of the very first Phase 0 agreements, not something ML discovers mid-build.
- A heads-up on which exact rows/timestamps are the "golden" scripted ones, since ML's model should be validated against producing sane output on exactly those rows.

**Phase 0 must lock, specifically:**
1. Column names/types across all 8 tables (§8) — the shared contract for everyone, not just ML/Backend.
2. The two function signatures above, including the exact `features` dict keys.
3. The list of golden scripted rows/scenes both sides will validate against.

Once those three things are agreed, ML and Backend can build fully in parallel and integrate with a single `import` statement, not a debugging session.

---

## 10. Development Plan — Four People, Four Tracks

**Phase 0 — Align (short, all 4 together):** Freeze the exact demo script scene-by-scene (§11) and the exact data each scene needs (§8). Lock the three items in §9.1. No new feature ideas past this point — scope is fixed.

| Track | Owner | Owns | Key outputs |
|---|---|---|---|
| **Frontend A — Mascot** | 1 of 2 frontend people | Bob component: hard hat/body layers, animation states, sound | Working Bob with all 4 states wired to real triggers |
| **Frontend B — Screens & Flow** | 1 of 2 frontend people | Home, Task+ETA, Safety alert, Idle-reason, Resume card, Training hub; stitches everything into the scripted flow | A working UI that turns Backend's API/data into the full demo script, end to end |
| **Backend** | 1 person | Minimal FastAPI service serving the golden dataset on cue; Gemini calls (translation, incident summary, voice Q&A) with fallbacks; idle-reason, checkpoint/resume, safety-event, training endpoints; imports and calls ML's `predict.py` (§9.1); the "advance scene" trigger | Working API/service the frontend can call for every feature, ETA/behavior numbers coming from the real models via §9.1 |
| **ML** | 1 person | Builds the expanded training rows (§8); trains the ETA regression model and the behavior/anomaly model; wraps both in the `predict.py` contract from §9.1, including the sane-range fallback; validates both models against the exact golden scripted rows | `predict.py` + trained model artifacts, validated to produce sane output at every scripted demo moment |

**Protect this time — don't let build eat into it:**
- Run the *entire* demo script start to finish, exactly as it'll be presented, at least 3–5 times — including watching what the two trained models actually output at each scripted moment.
- Freeze all changes (and freeze the trained models — don't retrain in the final hour) well before presenting.
- Leave real buffer to rest before presenting.

**Phase 2 — Integrate (all 4):** Wire Frontend ↔ Backend ↔ ML end-to-end via the §9.1 contract; run the full demo shift script live; fix what breaks at the seams.

**Phase 3 — Polish & Demo Prep (all 4):** UI polish pass, rehearse the pitch using §11, prepare answers for likely judge questions (why this stack, how it complements CAT's existing tools per §12, what's real vs. scripted per §4).

---

## 11. Demo Script

Good morning greeting (voice, mascot) → today's tasks (NOW/NEXT/LATER) → task starts, initial ETA (from the trained model) → idle occurs, mascot asks why, operator answers → condition changes, ETA recalculates via the model and explains why → safety event → mascot explains the alert, incident logged and summarized (Gemini) → task completes → behavior insight (from the trained model) → training recommendation (video + voice Q&A, Call Officer shown) → handover/resume card shows saved progress.

---

## 12. Known Limitations & Stretch Goals

Say these with confidence — don't build them:

- **Sensor gaming isn't solved** (e.g., buckling a seatbelt and immediately unfastening it) — a named future-work item, not something to attempt now.
- **Fatigue signal, offline sync, CV/PPE detection, predictive maintenance, tamper-resistance** remain named, scoped, future-facing answers, not built.
- **Simulation is referenced, not built** — the training hub deep-links to CAT's existing simulator/instructor-led programs rather than duplicating them.
- **The ML models are real, trained scikit-learn/XGBoost models — not hardcoded — but trained on a small, hand-built dataset (tens of rows, not the thousands a production model would see).** If asked how it scales: *"The architecture and pipeline are real — same approach we'd use in production, just trained on a small dataset for this build. More real operator data is what would take this from a working prototype to production-grade."*

**Why this doesn't duplicate CAT's existing tools:**
1. Cat Operator Coaching for Excavators
2. Cat VisionLink Productivity
3. Cat Operator Training
4. Cat Operator eLearning
5. Cat Simulator Training

The pitch: *"We didn't build machine telemetry — Caterpillar already has that. We built the human-centered layer that turns it into the one thing an operator actually needs in the moment: context and action."*

---

## Design Principle to Carry Forward

> **Don't make the operator operate the AI companion.**
> **Let the operator operate the machine — the companion manages the complexity around them.**
