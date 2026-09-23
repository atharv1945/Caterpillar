# CAT Operator AI Companion - Backend

**Backend Status:** FROZEN — DEMO READY
**Test status:** 18/18 passing

> **Do not modify backend functionality unless explicitly authorized.**

---

## 1. Backend Overview

The CAT Operator AI Companion backend serves as the core intelligence and orchestration layer for the operator-facing interface. It processes machine telemetry, manages task progression, evaluates safety rules, translates communications, and handles autonomous demo progression.

**Major Responsibilities:**
- Managing operator and task state.
- Real-time safety evaluation based on simulated telemetry.
- Translating UI phrases dynamically via Gemini (or offline fallbacks).
- Orchestrating the time-based simulated demo flow.
- Serving as the integration boundary for future ML models.

**Intentionally NOT Handled:**
- Production-scale database persistence (uses in-memory CSVs for the hackathon).
- UI rendering or styling.
- Actual hardware integration (uses simulated data).

---

## 2. Architecture

The architecture follows a standard FastAPI structure using a router-per-domain pattern.

```
Frontend 
  │
  ▼
FastAPI Backend (main.py, routers/)
  │
  ├──► Data Layer (load_all, app.state.data)
  │      └── In-memory Pandas DataFrames backed by CSVs
  │
  ├──► Business Logic (filters.py, rules.py, scene_state.py)
  │
  ├──► ML Bridge (ml_models/predict.py)
  │      └── Mocks pure functions for ETA & Behavior Insight
  │
  └──► Gemini Client (gemini_client.py)
         └── Fallback Layer (fallback_phrases.py) -> Deterministic offline strings
```

- **State:** Lives completely in-memory via `app.state.data`, loaded once at application boot from `backend/app/data/` CSV files.
- **Request Flow:** Requests hit domain-specific routers (e.g., `/safety`, `/tasks`), which read/write to `app.state.data` and serialize responses via Pydantic.
- **ML Integration:** Abstracted via `backend/ml_models/predict.py`. Real feature dictionaries are constructed, passed to mock models, and responses are returned.
- **Gemini Integration:** Abstracted via `backend/app/gemini_client.py`. Every call is heavily wrapped in a `try/except`.
- **Fallback Behavior:** If Gemini throws an error or no API key is present, the system instantly catches `GeminiUnavailable` and fetches a pre-defined string from `fallback_phrases.py`.
- **Demo Orchestration:** Driven entirely by a simulated autonomous clock in `scene_state.py`. Instead of manual tracking, scenes advance automatically based on elapsed simulation time unless a manual override lock is requested.

---

## 3. Repository Structure

```
backend/
├── main.py                     # App entry point, CORS, exception handlers, router registry
├── requirements.txt            # Python dependencies
├── .env.example                # Example environment variables
├── test_phase7.py              # Script testing standardized errors/CORS
├── app/
│   ├── data_loader.py          # CSV -> Pandas loading logic
│   ├── error_handlers.py       # Global 404, 422, 500 error handlers
│   ├── fallback_phrases.py     # Deterministic offline string translations
│   ├── filters.py              # Shared dataframe filtering utilities
│   ├── gemini_client.py        # Gemini SDK wrapper with timeout logic
│   ├── ml_bridge.py            # Feature engineering for ML integration
│   ├── rules.py                # Deterministic safety rule logic
│   ├── scene_state.py          # Demo clock and scene orchestration engine
│   ├── schemas.py              # Pydantic request/response models & sanitization
│   ├── store.py                # Utilities for appending/updating DataFrames
│   ├── data/                   # Seed CSV datasets (operators, tasks, telemetry, etc.)
│   └── routers/                # Domain specific endpoint handlers
│       ├── behavior.py
│       ├── checkpoints.py
│       ├── eta.py
│       ├── idle_events.py
│       ├── machines.py
│       ├── operators.py
│       ├── safety.py
│       ├── scene.py            # /scene endpoints for demo orchestration
│       ├── tasks.py
│       ├── telemetry.py
│       ├── translate.py
│       └── voice.py
├── ml_models/
│   ├── __init__.py
│   └── predict.py              # ML boundary containing mock predict_eta/predict_behavior
└── tests/                      # Pytest suite
    ├── conftest.py             # Shared FastAPI TestClient
    ├── test_checkpoints.py
    ├── test_dashboard.py
    ├── test_demo_flow.py       # Rehearsal loop for demo orchestrator
    ├── test_gemini_fallbacks.py# Chaos testing for Gemini outages
    ├── test_health.py
    ├── test_idle_events.py
    ├── test_ml_bridge.py
    └── test_safety_rules.py
```

---

## 4. Technology Stack

- **Framework:** FastAPI
- **Validation:** Pydantic
- **Data Manipulation:** Pandas (for parsing CSVs and querying in-memory state)
- **AI Integration:** `google-genai` (Google Gemini SDK)
- **Testing:** `pytest` & `httpx`
- **Environment:** `python-dotenv`
- **Server:** `uvicorn`

---

## 5. Data Layer

The hackathon backend uses local CSV files loaded into Pandas DataFrames.
- **Files:** `operators.csv`, `tasks.csv`, `telemetry.csv`, `idle_events.csv`, `task_checkpoints.csv`, `safety_events.csv`, `machines.csv`, `training_content.csv`.
- **Loading:** Loaded *exactly once* during the FastAPI startup lifecycle (`lifespan` in `main.py`).
- **State Mutability:** Data is manipulated in-memory (e.g. updating task status). Data modifications are optionally persisted back to CSV via `app.store.persist()`, though this is purely for session continuity and not production durability.
- **Why CSV?** It is sufficient for a hackathon, easy for operators to manually seed golden scenario data, and ensures zero database configuration friction.

---

## 6. API Endpoints

*(A complete endpoint contract is also available in [API_CONTRACT.md](API_CONTRACT.md))*

**Routers & Endpoints:**
- **Operators:** `GET /operators/{operator_id}`
- **Machines:** `GET /machines/{machine_id}`
- **Tasks:** 
  - `GET /tasks`
  - `GET /tasks/dashboard` (Returns grouped now/next/later tasks)
  - `GET /tasks/{task_id}`
- **Checkpoints:** 
  - `POST /tasks/{task_id}/checkpoint`
  - `GET /tasks/{task_id}/resume` (Fetches context and briefing sentence for task handover)
- **Telemetry:** 
  - `POST /telemetry`
  - `GET /telemetry/{task_id}/golden`
- **Safety:** 
  - `GET /safety/check`
  - `GET /safety/events`
  - `GET /safety/events/{event_id}`
  - `POST /safety/events/{event_id}/log_incident`
  - `POST /safety/events/{event_id}/summarize`
- **Idle Events:** 
  - `GET /idle_events/active`
  - `POST /idle_events/{idle_event_id}/reason`
- **ETA & Behavior:** 
  - `GET /tasks/{task_id}/eta`
  - `GET /tasks/{task_id}/behavior_insight`
- **Translation / Voice:** 
  - `POST /translate`
  - `POST /voice/qa`
- **Scene Orchestration:** 
  - `GET /scene/current`
  - `POST /scene/advance`
  - `POST /scene/reset`

---

## 7. Pydantic Schemas / Contracts

Defined in `backend/app/schemas.py`.

**Important Features:**
- **Sanitization:** `BaseSchema.clean_data` acts as a global sanitizer. It automatically normalizes all datetime strings into strict ISO 8601 strings and forcefully casts CSV string representations of booleans (e.g., `"TRUE"`) into native Python booleans.
- **Key Schemas:**
  - `DashboardResponse`: Buckets tasks into `now`, `next`, and `later` (lists of `TaskOut`).
  - `SafetyAlertOut`: `{triggered: bool, severity: str, message: str, task_id: str, timestamp: str}`.
  - `TranslateOut` / `VoiceQAOut` / `SummaryOut`: Always include a `source` field (`"gemini"` or `"fallback"`) to inform the UI of degradation.
  - `SceneOut`: Returns `{scene_index, scene_name, total_scenes, payload}`. The payload dynamically maps to the required data for that specific scene.

---

## 8. Scene / Demo Orchestration

The `/scene` system is a specialized orchestration layer built **exclusively for demo presentation.** It does not represent a production workflow engine.

- **Simulated Timing:** Driven by a fast-forwarded clock (`SIM_MINUTES_PER_REAL_SECOND = 1.0`).
- **Endpoints:**
  - `GET /scene/current`: The frontend polls this autonomously. It calculates elapsed time and automatically progresses the UI to the correct beat without user input.
  - `POST /scene/advance`: Allows a presenter to forcibly skip to the next scene. This sets a `manual_override_index`, freezing the autonomous clock until reset.
  - `POST /scene/reset`: Resets the demo clock and clears overrides.
- **9 Demo Scenes (in order):**
  1. `morning_greeting`
  2. `dashboard`
  3. `task_start_eta`
  4. `idle_moment`
  5. `condition_change_eta_recalc`
  6. `safety_event`
  7. `task_complete_behavior_insight`
  8. `training_recommendation`
  9. `handover_resume`
- **Payload Assembly:** Scene data isn't fake. `scene_state.py` calls the actual backend APIs (e.g., `build_eta_features`, `summarize_safety_event`) to construct the payload for each scene block.

---

## 9. ML Integration

The ML layer is strictly segregated to allow data scientists to drop in a real model later without disrupting the backend.
- **Contract Boundary:** Located in `backend/ml_models/predict.py`. Contains two functions:
  - `predict_eta(features: dict) -> dict`
  - `predict_behavior(features: dict) -> dict`
- **Feature Engineering:** `backend/app/ml_bridge.py` intercepts incoming requests, queries `telemetry` and `tasks` state, constructs the agreed-upon `features` dictionary, and passes it to the `predict_*` functions.
- **Current State:** The current `predict.py` is a mock that inspects the features and returns mathematically plausible (but hardcoded/simulated) scores and ETA minutes.

---

## 10. Gemini Integration

- **Initialization:** `backend/app/gemini_client.py` looks for `GEMINI_API_KEY`.
- **Endpoints Utilizing Gemini:**
  - `/translate` (Translates specific UI elements)
  - `/voice/qa` (Answering operator questions)
  - `/safety/events/{event_id}/summarize` (Generating narrative summaries of safety incidents)
- **Robustness:** If the `GEMINI_API_KEY` is missing, the network times out, or the LLM is blocked by safety filters, `call_gemini` raises a `GeminiUnavailable` exception.
- **Fallback:** Endpoints catch `GeminiUnavailable` and instantly route to offline lookup tables in `fallback_phrases.py`.
- **Environment:** Keys are expected in a `.env` file at the root. (See `.env.example`). Never commit keys.

---

## 11. Multilingual Support

The backend natively supports exactly **three** languages:
- English (`en`)
- Hindi (`hi`)
- Tamil (`ta`)

**Behavior:**
- Handled primarily by `POST /translate` and `POST /voice/qa`.
- If Gemini is active, it translates the text fluidly.
- If Gemini fails, the backend falls back to deterministic translations mapped in `fallback_phrases.py` (which comprehensively maps demo-critical phrases for these three languages).

---

## 12. Safety System

The safety evaluation is **deterministic** and explicitly decoupled from LLMs to ensure life-safety reliability.
- **Rule Engine:** `rules.py` evaluates pure telemetry (e.g., `seatbelt_status == "unfastened"`) returning `critical`, `warning`, or `clear`.
- **Logging:** Incident responses can be added via `POST /safety/events/{id}/log_incident`.
- **Summarization:** Only the *after-action summary* (`/summarize`) utilizes Gemini.

---

## 13. Idle Events / Task Checkpoints / Task State

- **Idle Events:** Tracks when machines are non-productive. Active events are fetched via `/idle_events/active`. Operators must provide a reason code (`waiting_truck_material`, `scheduled_break`, etc.) to resolve them.
- **Checkpoints:** Work progress is POSTed to `/tasks/{id}/checkpoint`. 
- **Resume Briefing:** A dynamically assembled context string (e.g., `"Resuming Trenching. 55% complete. Ground is muddy."`) is generated via `GET /tasks/{id}/resume` to context-switch a new operator.

---

## 14. Error Handling

Global exception handlers are registered in `main.py` (`app/error_handlers.py`).
- **Validation Errors (422):** Standardized format.
- **Not Found (404):** Standardized format.
- **Internal Server Errors (500):** Traps unhandled exceptions, logs the stack trace to the server console, but sanitizes the client response to hide internal architecture.
- **Standard Shape:** All errors return: `{"error": true, "status_code": int, "detail": str}`.

---

## 15. Testing

- **Suite:** Complete `pytest` suite located in `backend/tests/`.
- **Total Tests:** 18
- **Current Status:** 18/18 Passing (100% pass rate).
- **Chaos Testing:** `test_gemini_fallbacks.py` forcefully monkeypatches Gemini outages to confirm translation and summarization fallbacks operate seamlessly.
- **Demo Flow Testing:** `test_demo_flow.py` validates the entire 9-step scene progression, running 3 consecutive loop rehearsal passes to guarantee determinism.

---

## 16. Running the Backend Locally

```bash
# 1. Navigate to backend
cd backend

# 2. Set up virtual environment (Optional but recommended)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
cp .env.example .env
# (Edit .env to add your GEMINI_API_KEY if desired)

# 5. Start Server
uvicorn main:app --reload

# 6. Run Tests
python -m pytest tests/
```

- Verify health: `curl http://localhost:8000/health`
- OpenAPI Docs: `http://localhost:8000/docs`

---

## 17. Frontend Integration Guide

- **Base URL:** `http://localhost:8000`
- **CORS:** Pre-configured for `http://localhost:3000` and `http://localhost:5173`.
- **Demo Consumption:**
  - On mount, your React UI should interval-poll `GET /scene/current`.
  - Extract `scene_name` and use it to switch your UI component.
  - Pass the attached `payload` directly to the active UI component.
  - Provide a hidden debug button bound to `POST /scene/advance` to allow the presenter to skip through the demo manually.
- **Errors:** Check `if (response.error)` on failed fetches.
- **Safety Fields:** All backend timestamps are guaranteed to be ISO 8601 strings. Booleans are true booleans.

---

## 18. Demo Flow

1. **Morning greeting:** Fetches operator profile and initial translated greeting.
2. **Dashboard:** Loads `now`, `next`, `later` task assignments.
3. **Task start + ETA:** Predicts baseline completion time.
4. **Idle moment:** Generates an active idle event prompting operator for a reason.
5. **Condition change + ETA recalculation:** Triggers updated telemetry and a revised ETA.
6. **Safety event:** Proximity/Seatbelt rule triggers an alert; operator logs resolution.
7. **Task completion + behavior insight:** ML evaluates historical telemetry for anomalies.
8. **Training recommendation:** Suggests specific learning modules based on anomalies.
9. **Handover/resume:** Prepares dynamic resume briefing for next shift.

---

## 19. Environment Variables / Secrets

- `GEMINI_API_KEY`: The only environment variable used. (Optional). If missing, the application relies on offline fallbacks automatically.
- **Do not commit `.env`.** 

---

## 20. Known Limitations

- **In-Memory State:** Since state is modified purely in memory Pandas dataframes (persisted to CSV files occasionally), horizontal scaling or production database guarantees are not supported.
- **Demo Clock:** The `/scene` state machine relies on a simulated temporal clock rather than actual realtime event ingestion.

---

## 21. Frozen Backend Rules

**The backend is currently FROZEN.**
- The functionality is complete and 18/18 tests pass.
- `FROZEN.md` serves as the official freeze record.
- Future frontend work must adapt to the existing API structure.
- **Developers & Agents:** Do not casually refactor or alter API contracts. Any modification must be discussed, explicitly approved, and regression tested.

---

## 22. Troubleshooting

- **CORS Errors:** Verify your frontend is running on ports 3000 or 5173. If not, append your port to the CORS `allow_origins` array in `main.py`.
- **Tests Failing with 'pytest' not recognized:** Run `python -m pytest tests/` instead.
- **Gemini Translated Text looks hardcoded:** Gemini is likely unreachable or you forgot the API key in `.env`. The backend is purposefully returning offline fallbacks.
- **Demo Clock Not Advancing:** Ensure you aren't stuck on a manual override. Fire `POST /scene/reset` to unlock the clock.

---

## 23. Quick Reference for AI Coding Agents

**ATTN: AI AGENTS**
Before modifying backend code:
1. Read this README.
2. Read `FROZEN.md`.
3. Read `API_CONTRACT.md`.
4. Inspect the existing implementation.
5. Do not assume planned features exist; map them against what is built.
6. Do not change existing API contracts without explicit approval from the USER.
7. Run `python -m pytest tests/` after any backend modification.
8. Preserve all deterministic fallbacks.
9. Never expose secrets.
10. Treat the frozen backend as the single source of truth.

### File Map
- `main.py` → application/lifespan/router registration
- `routers/` → HTTP endpoints
- `schemas.py` → API contracts
- `data/` → seeded CSV data
- `ml_bridge.py` → ML integration
- `gemini_client.py` → Gemini integration
- `fallback_phrases.py` → deterministic multilingual fallback
- `scene_state.py` → demo scene state/timing
- `scene.py` → demo scene API
- `tests/` → regression protection
