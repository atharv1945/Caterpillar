import pandas as pd
import random
from datetime import datetime, timedelta
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "app", "data")
os.makedirs(DATA_DIR, exist_ok=True)

# 1. operators
pd.DataFrame([
    {"operator_id": "OP1001", "name": "John Doe", "preferred_language": "English"},
    {"operator_id": "OP1002", "name": "Rajesh Kumar", "preferred_language": "Hindi"}
]).to_csv(os.path.join(DATA_DIR, "operators.csv"), index=False)

# 2. machines
pd.DataFrame([
    {"machine_id": "EXC001", "machine_type": "Excavator"}
]).to_csv(os.path.join(DATA_DIR, "machines.csv"), index=False)

# 3. tasks
pd.DataFrame([
    {"task_id": "TSK001", "machine_id": "EXC001", "operator_id": "OP1001", "task_name": "Morning Excavation", "zone": "Zone A", "scheduled_start": "08:00", "scheduled_end": "10:30", "status": "completed"},
    {"task_id": "TSK002", "machine_id": "EXC001", "operator_id": "OP1001", "task_name": "Trenching", "zone": "Zone B", "scheduled_start": "10:45", "scheduled_end": "12:30", "status": "in_progress"},
    {"task_id": "TSK003", "machine_id": "EXC001", "operator_id": "OP1001", "task_name": "Site Grading", "zone": "Zone C", "scheduled_start": "13:30", "scheduled_end": "15:00", "status": "scheduled"},
    {"task_id": "TSK004", "machine_id": "EXC001", "operator_id": "OP1001", "task_name": "Material Loading", "zone": "Zone D", "scheduled_start": "15:15", "scheduled_end": "17:00", "status": "scheduled"}
]).to_csv(os.path.join(DATA_DIR, "tasks.csv"), index=False)

# 4. telemetry
telemetry_data = []
# Golden rows (18)
base_time = datetime(2024, 10, 1, 8, 0)
for i in range(18):
    t = base_time + timedelta(minutes=i*10)
    idle_min = 0
    if i == 4: idle_min = 5
    if i == 5: idle_min = 15
    if i == 6: idle_min = 25 # idle moment peak
    
    weather = "clear"
    ground = "dry"
    if i >= 8: 
        weather = "rain"
        ground = "wet"
        
    seatbelt = "fastened"
    if i == 11:
        seatbelt = "unfastened"
        
    telemetry_data.append({
        "timestamp": t.strftime("%Y-%m-%d %H:%M:%S"),
        "machine_id": "EXC001",
        "operator_id": "OP1001",
        "task_id": "TSK001",
        "engine_hours": 1200.0 + (i*0.2),
        "fuel_used_l": i * 1.5,
        "load_cycles": i * 2,
        "idling_time_min": idle_min,
        "seatbelt_status": seatbelt,
        "proximity_alert": False,
        "weather_condition": weather,
        "ground_condition": ground,
        "is_golden": True
    })

# Training rows (50)
for i in range(50):
    telemetry_data.append({
        "timestamp": (base_time - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d %H:%M:%S"),
        "machine_id": "EXC001",
        "operator_id": random.choice(["OP1001", "OP1002"]),
        "task_id": f"TSK{random.randint(100, 999)}",
        "engine_hours": random.uniform(1000, 1200),
        "fuel_used_l": random.uniform(10, 100),
        "load_cycles": random.randint(10, 100),
        "idling_time_min": random.choice([0, 0, 5, 10, 30, 45]),
        "seatbelt_status": random.choice(["fastened", "unfastened"]),
        "proximity_alert": random.choice([False, True]),
        "weather_condition": random.choice(["clear", "rain", "fog"]),
        "ground_condition": random.choice(["dry", "wet", "muddy"]),
        "is_golden": False
    })

pd.DataFrame(telemetry_data).to_csv(os.path.join(DATA_DIR, "telemetry.csv"), index=False)

# 5. idle_events
idle_data = [
    {
        "idle_event_id": "IE001",
        "machine_id": "EXC001",
        "operator_id": "OP1001",
        "task_id": "TSK001",
        "idle_start": (base_time + timedelta(minutes=40)).strftime("%Y-%m-%d %H:%M:%S"),
        "idle_end": (base_time + timedelta(minutes=65)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_min": 25,
        "idle_reason_code": "",
        "reason_source": ""
    }
]
for i in range(5):
    idle_data.append({
        "idle_event_id": f"IE{100+i}",
        "machine_id": "EXC001",
        "operator_id": random.choice(["OP1001", "OP1002"]),
        "task_id": f"TSK{random.randint(100, 999)}",
        "idle_start": "2024-09-01 10:00:00",
        "idle_end": "2024-09-01 10:30:00",
        "duration_min": 30,
        "idle_reason_code": random.choice(["waiting_truck", "break", "weather"]),
        "reason_source": "operator"
    })
pd.DataFrame(idle_data).to_csv(os.path.join(DATA_DIR, "idle_events.csv"), index=False)

# 6. task_checkpoints
pd.DataFrame([
    {
        "task_id": "TSK002",
        "checkpoint_time": "12:00:00",
        "progress_pct": 50,
        "cycles_completed": 12,
        "notes": "Paused for lunch, ground is a bit rocky",
        "event_type": "pause",
        "operator_id": "OP1001"
    },
    {
        "task_id": "TSK002",
        "checkpoint_time": "12:45:00",
        "progress_pct": 50,
        "cycles_completed": 12,
        "notes": "Resuming after lunch",
        "event_type": "resume",
        "operator_id": "OP1001"
    }
]).to_csv(os.path.join(DATA_DIR, "task_checkpoints.csv"), index=False)

# 7. safety_events
pd.DataFrame([
    {
        "event_id": "SE001",
        "machine_id": "EXC001",
        "operator_id": "OP1001",
        "timestamp": (base_time + timedelta(minutes=110)).strftime("%Y-%m-%d %H:%M:%S"),
        "event_type": "seatbelt_unfastened",
        "severity": "high",
        "resolved": False
    }
]).to_csv(os.path.join(DATA_DIR, "safety_events.csv"), index=False)

# 8. training_content
pd.DataFrame([
    {
        "content_id": "TR001",
        "title": "Excavator Basics",
        "language": "English",
        "video_url_or_path": "/static/training/excavator_basics_en.mp4"
    },
    {
        "content_id": "TR002",
        "title": "Safety Guidelines",
        "language": "Hindi",
        "video_url_or_path": "/static/training/safety_guidelines_hi.mp4"
    }
]).to_csv(os.path.join(DATA_DIR, "training_content.csv"), index=False)

print("Generated all 8 CSV files successfully.")
