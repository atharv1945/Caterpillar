"""
generate_dataset.py
CAT Operator AI Companion — Synthetic ML Dataset Generator
Writes 8 CSVs to ./ml_models/data/  (run from repo root or from this file's dir)
Seed: 42  |  No internet calls  |  No external data sources
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)))  # ./ml_models/data/

# ── Shared anchors ────────────────────────────────────────────────────────────
SHIFT_START = datetime(2024, 9, 23, 6, 0, 0)   # 06:00 golden shift day
MACHINE_ID  = "EXC001"
OP1, OP2    = "OP001", "OP002"
TASK_GOLDEN = "TSK003"   # the task that spans the golden demo window

# ── 1. operators.csv ─────────────────────────────────────────────────────────
operators = pd.DataFrame([
    {"operator_id": OP1, "name": "Raj Patel",      "preferred_language": "English"},
    {"operator_id": OP2, "name": "Carlos Mendez",  "preferred_language": "Spanish"},
])
operators.to_csv(os.path.join(OUT, "operators.csv"), index=False)

# ── 2. machines.csv ──────────────────────────────────────────────────────────
machines = pd.DataFrame([
    {"machine_id": MACHINE_ID, "machine_type": "Excavator"},
])
machines.to_csv(os.path.join(OUT, "machines.csv"), index=False)

# ── 3. tasks.csv ─────────────────────────────────────────────────────────────
tasks = pd.DataFrame([
    {"task_id": "TSK001", "machine_id": MACHINE_ID, "operator_id": OP2,
     "task_name": "Site Clearing — Zone A", "zone": "Zone-A",
     "scheduled_start": SHIFT_START - timedelta(hours=2),
     "scheduled_end":   SHIFT_START - timedelta(minutes=30), "status": "Completed"},
    {"task_id": "TSK002", "machine_id": MACHINE_ID, "operator_id": OP1,
     "task_name": "Trench Excavation — Zone B", "zone": "Zone-B",
     "scheduled_start": SHIFT_START - timedelta(minutes=30),
     "scheduled_end":   SHIFT_START + timedelta(hours=1, minutes=30), "status": "Completed"},
    {"task_id": TASK_GOLDEN, "machine_id": MACHINE_ID, "operator_id": OP1,
     "task_name": "Foundation Dig — Zone C",   "zone": "Zone-C",
     "scheduled_start": SHIFT_START + timedelta(hours=2),
     "scheduled_end":   SHIFT_START + timedelta(hours=10, minutes=30), "status": "In Progress"},
    {"task_id": "TSK004", "machine_id": MACHINE_ID, "operator_id": OP2,
     "task_name": "Material Loading — Zone D", "zone": "Zone-D",
     "scheduled_start": SHIFT_START + timedelta(hours=11),
     "scheduled_end":   SHIFT_START + timedelta(hours=14), "status": "Scheduled"},
])
tasks.to_csv(os.path.join(OUT, "tasks.csv"), index=False)

# ── 4. telemetry.csv — golden rows ───────────────────────────────────────────
golden_beats = [
    # ts_offset_h, eng_h,  fuel, cycles, idle_min, belt,         prox, weather,    ground, scene
    (0.0,  412.0, 12.0,  5,  3, "Fastened",   0, "Sunny",    "Dry",   "normal_work"),
    (0.5,  412.5, 23.5,  5,  4, "Fastened",   0, "Sunny",    "Dry",   "normal_work"),
    (1.0,  413.0, 34.8,  6,  4, "Fastened",   0, "Sunny",    "Dry",   "normal_work"),
    (1.5,  413.5, 46.1,  6,  5, "Fastened",   0, "Sunny",    "Dry",   "normal_work"),
    (2.0,  414.0, 57.2,  7,  5, "Fastened",   0, "Overcast", "Dry",   "normal_work"),
    (2.5,  414.5, 63.0,  3, 18, "Fastened",   0, "Overcast", "Dry",   "idle_event"),
    (3.0,  415.0, 68.4,  4,  7, "Fastened",   0, "Overcast", "Dry",   "idle_recovery"),
    (3.5,  415.5, 74.1,  3,  9, "Fastened",   0, "Rainy",    "Wet",   "ground_wet_slowdown"),
    (4.0,  416.0, 79.3,  2, 14, "Fastened",   0, "Rainy",    "Wet",   "ground_wet_slowdown"),
    (4.5,  416.5, 83.9,  2, 16, "Fastened",   0, "Rainy",    "Wet",   "ground_wet_slowdown"),
    (5.0,  417.0, 87.4,  1, 19, "Fastened",   0, "Rainy",    "Muddy", "ground_wet_slowdown"),
    (5.5,  417.5, 90.1,  1, 22, "Unfastened", 1, "Rainy",    "Muddy", "safety_event"),
    (6.0,  418.0, 93.6,  1, 20, "Fastened",   0, "Rainy",    "Muddy", "safety_recovery"),
    (6.5,  418.5, 97.8,  3, 15, "Fastened",   0, "Overcast", "Wet",   "recovery"),
    (7.0,  419.0,102.3,  4, 12, "Fastened",   0, "Overcast", "Wet",   "recovery"),
    (7.5,  419.5,107.1,  5,  8, "Fastened",   0, "Sunny",    "Dry",   "recovery"),
    (8.0,  420.0,112.4,  6, 28, "Fastened",   0, "Sunny",    "Dry",   "anomaly_high_idle"),
    (8.5,  420.5,117.8,  7, 30, "Fastened",   0, "Sunny",    "Dry",   "task_completion"),
]

golden_rows = []
for i, (off, eng, fuel, cyc, idle, belt, prox, wx, gnd, scene) in enumerate(golden_beats):
    ts = SHIFT_START + timedelta(hours=off + 2)
    golden_rows.append({
        "timestamp": ts, "machine_id": MACHINE_ID, "operator_id": OP1,
        "task_id": TASK_GOLDEN,
        "engine_hours": eng, "fuel_used_l": fuel, "load_cycles": cyc,
        "idling_time_min": idle, "seatbelt_status": belt,
        "proximity_alert": prox, "weather_condition": wx, "ground_condition": gnd,
        "is_golden": True, "scene": scene,
    })

# ── 4. telemetry.csv — training rows ─────────────────────────────────────────
rng = np.random.default_rng(SEED)
WEATHER  = ["Sunny", "Rainy", "Overcast"]
GROUND   = ["Dry", "Wet", "Muddy"]
TASKS_TR = ["TSK001", "TSK002", "TSK004"]

train_rows = []
eng_h = 380.0
for i in range(50):
    ts = SHIFT_START - timedelta(days=int(rng.integers(1, 30)),
                                  hours=int(rng.integers(0, 8)),
                                  minutes=int(rng.integers(0, 60)))
    wx  = rng.choice(WEATHER, p=[0.5, 0.3, 0.2])
    gnd = rng.choice(GROUND,  p=[0.5, 0.3, 0.2])

    if gnd == "Muddy":
        cyc  = int(rng.integers(1, 5))
        idle = int(rng.integers(20, 65))
    elif gnd == "Wet":
        cyc  = int(rng.integers(3, 9))
        idle = int(rng.integers(10, 40))
    else:
        cyc  = int(rng.integers(7, 16))
        idle = int(rng.integers(2, 18))

    belt = "Unfastened" if rng.random() < 0.15 else "Fastened"
    prox = int(rng.random() < 0.12)

    if belt == "Unfastened" or prox == 1:
        idle = min(65, idle + int(rng.integers(3, 10)))

    eng_h += float(rng.uniform(0.3, 1.2))
    fuel   = round(eng_h * 0.28 + float(rng.uniform(-2, 2)), 1)
    task   = str(rng.choice(TASKS_TR))
    op     = OP1 if task in ["TSK001", "TSK002"] else OP2

    train_rows.append({
        "timestamp": ts, "machine_id": MACHINE_ID, "operator_id": op,
        "task_id": task, "engine_hours": round(eng_h, 1), "fuel_used_l": fuel,
        "load_cycles": cyc, "idling_time_min": idle, "seatbelt_status": belt,
        "proximity_alert": prox, "weather_condition": str(wx), "ground_condition": str(gnd),
        "is_golden": False, "scene": "",
    })

telemetry = pd.DataFrame(golden_rows + train_rows)
telemetry.to_csv(os.path.join(OUT, "telemetry.csv"), index=False)

# ── 5. idle_events.csv ───────────────────────────────────────────────────────
golden_idle_ts = SHIFT_START + timedelta(hours=2.5 + 2)
idle_reasons   = ["waiting_truck","waiting_instructions","mechanical","weather","scheduled_break","other"]
idle_events = [
    {"idle_event_id": "IDL000", "machine_id": MACHINE_ID, "operator_id": OP1,
     "task_id": TASK_GOLDEN,
     "idle_start": golden_idle_ts, "idle_end": golden_idle_ts + timedelta(minutes=18),
     "duration_min": 18, "idle_reason_code": "waiting_truck", "reason_source": "operator_confirmed"},
]
for j in range(8):
    row_idx = int(rng.integers(0, 50))
    tr      = train_rows[row_idx]
    i_start = tr["timestamp"] + timedelta(minutes=5)
    dur     = int(tr["idling_time_min"])
    idle_events.append({
        "idle_event_id": f"IDL{j+1:03d}", "machine_id": MACHINE_ID,
        "operator_id": str(tr["operator_id"]), "task_id": str(tr["task_id"]),
        "idle_start": i_start, "idle_end": i_start + timedelta(minutes=dur),
        "duration_min": dur,
        "idle_reason_code": str(rng.choice(idle_reasons)),
        "reason_source": str(rng.choice(["system_inferred", "operator_confirmed"])),
    })
pd.DataFrame(idle_events).to_csv(os.path.join(OUT, "idle_events.csv"), index=False)

# ── 6. task_checkpoints.csv ──────────────────────────────────────────────────
chk_base = SHIFT_START + timedelta(hours=2 + 2)
task_checkpoints = pd.DataFrame([
    {"task_id": TASK_GOLDEN, "checkpoint_time": chk_base + timedelta(hours=2, minutes=45),
     "progress_pct": 38, "cycles_completed": 18, "operator_id": OP1,
     "event_type": "pause", "notes": "Stopped — waiting for dump truck at Zone-C entrance"},
    {"task_id": TASK_GOLDEN, "checkpoint_time": chk_base + timedelta(hours=3, minutes=8),
     "progress_pct": 38, "cycles_completed": 18, "operator_id": OP1,
     "event_type": "resume", "notes": "Resumed operations after truck arrived"},
])
task_checkpoints.to_csv(os.path.join(OUT, "task_checkpoints.csv"), index=False)

# ── 7. safety_events.csv ─────────────────────────────────────────────────────
safety_ts = SHIFT_START + timedelta(hours=5.5 + 2)
safety_events = pd.DataFrame([
    {"event_id": "EVT001", "machine_id": MACHINE_ID, "operator_id": OP1,
     "timestamp": safety_ts, "event_type": "seatbelt_unfastened+proximity_breach",
     "severity": "High", "resolved": True},
])
safety_events.to_csv(os.path.join(OUT, "safety_events.csv"), index=False)

# ── 8. training_content.csv ──────────────────────────────────────────────────
training_content = pd.DataFrame([
    {"content_id": "CNT001",
     "title": "Safe Excavator Operation & Proximity Hazard Awareness",
     "language": "English",
     "video_url_or_path": "content/videos/safe_excavator_operation_en.mp4"},
])
training_content.to_csv(os.path.join(OUT, "training_content.csv"), index=False)

# ── Sanity Check ─────────────────────────────────────────────────────────────
print("\n=== Row Counts ===")
files = ["operators","machines","tasks","telemetry","idle_events",
         "task_checkpoints","safety_events","training_content"]
for f in files:
    df = pd.read_csv(os.path.join(OUT, f"{f}.csv"))
    print(f"  {(f+'.csv'):<28} {len(df):>3} rows")

print("\n=== telemetry.csv — describe() ===")
tel = pd.read_csv(os.path.join(OUT, "telemetry.csv"))
print(tel[["engine_hours","fuel_used_l","load_cycles","idling_time_min","proximity_alert"]].describe().round(2).to_string())

print("\n=== telemetry.csv — categoricals ===")
for col in ["seatbelt_status","weather_condition","ground_condition","is_golden"]:
    print(f"\n  {col}:\n{tel[col].value_counts().to_string()}")

print("\n=== idle_events — idle_reason_code ===")
ie = pd.read_csv(os.path.join(OUT, "idle_events.csv"))
print(ie["idle_reason_code"].value_counts().to_string())
print("\n[OK] All 8 CSVs written to", OUT)
