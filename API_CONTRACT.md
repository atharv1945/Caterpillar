# CAT Operator AI Companion - API Contract

This document outlines all frontend-facing endpoints built across Phases 1-6. Standardized error responses (e.g. 404, 422, 500) will follow this exact shape:
```json
{
  "error": true,
  "status_code": 404,
  "detail": "Tasks data not found"
}
```

---

## Operators

### `GET /operators/{operator_id}`
**Purpose:** Fetch core profile details for an operator.
**Response:**
```json
{
  "operator_id": "OP1001",
  "name": "John Doe",
  "preferred_language": "English"
}
```

---

## Machines

### `GET /machines/{machine_id}`
**Purpose:** Fetch core details for a machine.
**Response:**
```json
{
  "machine_id": "EXC001",
  "machine_type": "Excavator"
}
```

---

## Tasks

### `GET /tasks/dashboard`
**Purpose:** Returns a dashboard view grouping tasks into now, next, and later for an operator. (Requires `?operator_id=` query param)
**Response:**
```json
{
  "now": {
    "task_id": "TSK002",
    "machine_id": "EXC001",
    "operator_id": "OP1001",
    "task_name": "Trenching",
    "zone": "Zone B",
    "scheduled_start": "2024-10-01T10:45:00",
    "scheduled_end": "2024-10-01T12:30:00",
    "status": "in_progress"
  },
  "next": {
    "task_id": "TSK003",
    "machine_id": "EXC001",
    "operator_id": "OP1001",
    "task_name": "Site Grading",
    "zone": "Zone C",
    "scheduled_start": "2024-10-01T13:30:00",
    "scheduled_end": "2024-10-01T15:00:00",
    "status": "scheduled"
  },
  "later": []
}
```

### `GET /tasks`
**Purpose:** List all tasks (can optionally filter with `?operator_id=OP1001`).
**Response:**
```json
[
  {
    "task_id": "TSK001",
    "machine_id": "EXC001",
    "operator_id": "OP1001",
    "task_name": "Morning Excavation",
    "zone": "Zone A",
    "scheduled_start": "2024-10-01T08:00:00",
    "scheduled_end": "2024-10-01T10:30:00",
    "status": "completed"
  }
]
```

### `GET /tasks/{task_id}`
**Purpose:** Fetch details of a single task.
**Response:** *(Same shape as a single Task above)*

### `GET /tasks/{task_id}/eta`
**Purpose:** Calculate machine-learning backed ETA prediction for task completion.
**Response:**
```json
{
  "task_id": "TSK001",
  "eta_minutes": 135.5,
  "source": "gemini",
  "explanation": "ETA updated based on current progress."
}
```

### `GET /tasks/{task_id}/behavior_insight`
**Purpose:** Return ML-driven behavior insights/anomalies for the current task.
**Response:**
```json
{
  "task_id": "TSK001",
  "is_anomalous": false,
  "score": 0.12,
  "source": "mock",
  "message": "No unusual patterns detected"
}
```

### `POST /tasks/{task_id}/checkpoint`
**Purpose:** Log progress/checkpoint against an active task.
**Request:**
```json
{
  "progress_pct": 55.0,
  "cycles_completed": 20,
  "notes": "Rocky terrain slowing progress",
  "event_type": "pause"
}
```
**Response:**
```json
{
  "task_id": "TSK001",
  "checkpoint_time": "2024-10-01T11:00:00",
  "progress_pct": 55.0,
  "cycles_completed": 20,
  "notes": "Rocky terrain slowing progress",
  "event_type": "pause",
  "operator_id": "OP1001"
}
```

### `GET /tasks/{task_id}/resume`
**Purpose:** Fetch context to resume a previously paused or handed-over task.
**Response:**
```json
{
  "task_id": "TSK001",
  "task_name": "Morning Excavation",
  "zone": "Zone A",
  "progress_pct": 55.0,
  "cycles_completed": 20,
  "total_cycles": null,
  "ground_condition": "dry",
  "last_note": "Rocky terrain slowing progress",
  "briefing_sentence": "Resuming Morning Excavation – Zone A. 55.0% complete, 20 cycles done. Ground condition is dry. Last note: 'Rocky terrain slowing progress'."
}
```

---

## Telemetry

### `POST /telemetry`
**Purpose:** Ingest raw machine telemetry ping.
**Request:**
```json
{
  "machine_id": "EXC001",
  "operator_id": "OP1001",
  "task_id": "TSK001",
  "engine_hours": 1205.1,
  "fuel_used_l": 20.0,
  "load_cycles": 10,
  "idling_time_min": 5.5,
  "seatbelt_status": "fastened",
  "proximity_alert": false,
  "weather_condition": "clear",
  "ground_condition": "dry"
}
```
**Response:** *(Same shape as request plus ISO `timestamp` string)*

### `GET /telemetry/{task_id}/golden`
**Purpose:** Fetch the latest "golden" (clean/verified) telemetry row for a task.
**Response:** *(Same shape as Telemetry request above)*

---

## Safety

### `GET /safety/check`
**Purpose:** Check safety rules against latest telemetry (Requires `?task_id=` query param).
**Response:**
```json
{
  "triggered": true,
  "severity": "high",
  "message": "Seatbelt is unfastened while operating.",
  "task_id": "TSK001",
  "timestamp": "2024-10-01T09:50:00"
}
```

### `GET /safety/events`
**Purpose:** List historical safety events (Optional filters: `?machine_id=` & `?operator_id=`).
**Response:**
```json
[
  {
    "event_id": "SE001",
    "machine_id": "EXC001",
    "operator_id": "OP1001",
    "timestamp": "2024-10-01T09:50:00",
    "event_type": "seatbelt_unfastened",
    "severity": "high",
    "resolved": false,
    "note": null
  }
]
```

### `GET /safety/events/{event_id}`
**Purpose:** Fetch a single safety event.
**Response:** *(Same shape as a single Safety Event above)*

### `POST /safety/events/{event_id}/log_incident`
**Purpose:** Log an operator note and resolve a safety event.
**Request:**
```json
{
  "note": "Checked radio wiring."
}
```
**Response:**
```json
{
  "event_id": "SE001",
  "machine_id": "EXC001",
  "operator_id": "OP1001",
  "timestamp": "2024-10-01T09:50:00",
  "event_type": "seatbelt_unfastened",
  "severity": "high",
  "resolved": true,
  "note": "Checked radio wiring."
}
```

### `POST /safety/events/{event_id}/summarize`
**Purpose:** Generate a Gemini-backed summary of a safety event.
**Response:**
```json
{
  "event_id": "SE001",
  "summary": "At 2024-10-01 09:50:00, a high seatbelt_unfastened was detected on EXC001. Operator note: Checked radio wiring.",
  "source": "gemini"
}
```

---

## Idle Events

### `GET /idle_events/active`
**Purpose:** Retrieve the currently active idle event (Requires `?task_id=` query param).
**Response:**
```json
{
  "idle_event_id": "IE001",
  "machine_id": "EXC001",
  "operator_id": "OP1001",
  "task_id": "TSK001",
  "idle_start": "2024-10-01T08:40:00",
  "idle_end": null,
  "duration_min": 25,
  "idle_reason_code": null,
  "reason_source": null
}
```

### `POST /idle_events/{idle_event_id}/reason`
**Purpose:** Operator manually resolving an idle event by providing a reason.
**Request:**
```json
{
  "reason_code": "waiting_truck_material"
}
```
**Response:**
```json
{
  "idle_event_id": "IE001",
  "machine_id": "EXC001",
  "operator_id": "OP1001",
  "task_id": "TSK001",
  "idle_start": "2024-10-01T08:40:00",
  "idle_end": "2024-10-01T09:05:00",
  "duration_min": 25,
  "idle_reason_code": "waiting_truck_material",
  "reason_source": "operator"
}
```

---

## Translate / Voice

### `POST /translate`
**Purpose:** Deterministic multilingual translation (en/hi/ta) using Gemini or robust fallbacks.
**Request:**
```json
{
  "text": "Hello",
  "target_language": "hi",
  "phrase_key": "greeting"
}
```
**Response:**
```json
{
  "translated_text": "सुप्रभात। क्या आप आज के कार्यों के लिए तैयार हैं?",
  "source": "fallback"
}
```

### `POST /voice/qa`
**Purpose:** Intelligent voice Q&A assistant for the operator.
**Request:**
```json
{
  "question": "How do I start the engine?",
  "language": "en"
}
```
**Response:**
```json
{
  "answer": "Make sure the safety lever is engaged before turning the ignition key.",
  "source": "gemini"
}
```

---

## Scene Orchestration (Demo)

### `GET /scene/current`
**Purpose:** Polls the autonomous state machine clock for the active scene.
**Response:**
```json
{
  "scene_index": 2,
  "scene_name": "task_start_eta",
  "total_scenes": 9,
  "payload": {
    "eta": {
      "task_id": "TSK001",
      "eta_minutes": 135.5,
      "source": "gemini",
      "explanation": "ETA updated based on current progress."
    }
  }
}
```

### `POST /scene/advance`
**Purpose:** Natively skip forward to the next scene (sets manual override lock).
**Response:** *(Same shape as `/scene/current`)*

### `POST /scene/reset`
**Purpose:** Reset the simulation clock to the beginning.
**Response:**
```json
{
  "status": "success",
  "message": "Demo scene state has been reset."
}
```
