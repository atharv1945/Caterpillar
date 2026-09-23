import datetime
from app.routers.tasks import bucket_tasks
from app.ml_bridge import build_eta_features, build_behavior_features, explain_eta_change
from ml_models.predict import predict_eta, predict_behavior
from app.rules import evaluate_safety
from app.routers.safety import summarize_safety_event
from app.routers.checkpoints import build_resume_briefing
import pandas as pd

SIM_MINUTES_PER_REAL_SECOND = 1.0

SCENES = [
    {"name": "morning_greeting", "description": "Greeting the operator and presenting today's tasks.", "trigger_at_sim_minute": 0},
    {"name": "dashboard", "description": "Dashboard overview of now, next, later tasks.", "trigger_at_sim_minute": 2},
    {"name": "task_start_eta", "description": "Starting the task and providing initial ETA.", "trigger_at_sim_minute": 5},
    {"name": "idle_moment", "description": "Detecting an idle event and prompting the operator.", "trigger_at_sim_minute": 8},
    {"name": "condition_change_eta_recalc", "description": "Ground condition changed to wet, ETA recalculated.", "trigger_at_sim_minute": 12},
    {"name": "safety_event", "description": "Seatbelt unfastened during operation, triggering safety rule.", "trigger_at_sim_minute": 15},
    {"name": "task_complete_behavior_insight", "description": "Task completed, ML behavior insight provided.", "trigger_at_sim_minute": 18},
    {"name": "training_recommendation", "description": "Recommend training based on behavior and safety events.", "trigger_at_sim_minute": 22},
    {"name": "handover_resume", "description": "Handover to the next shift or resume next task.", "trigger_at_sim_minute": 26},
]

# Global State
shift_start_time = datetime.datetime.now()
manual_override_index = None

def get_current_scene_index() -> int:
    global manual_override_index, shift_start_time
    if manual_override_index is not None:
        return manual_override_index
        
    elapsed_real_seconds = (datetime.datetime.now() - shift_start_time).total_seconds()
    elapsed_sim_minutes = elapsed_real_seconds * SIM_MINUTES_PER_REAL_SECOND
    
    current_index = 0
    for i in range(len(SCENES) - 1, -1, -1):
        if SCENES[i]["trigger_at_sim_minute"] <= elapsed_sim_minutes:
            current_index = i
            break
            
    return current_index

def assemble_scene_payload(scene_name: str, app_state) -> dict:
    operator_id = "OP1001"
    task_id = "TSK001"
    
    payload = {}
    
    if scene_name == "morning_greeting":
        operators = app_state.data.get("operators")
        if operators is not None and not operators.empty:
            op_data = operators[operators['operator_id'] == operator_id]
            if not op_data.empty:
                payload["operator"] = op_data.iloc[0].to_dict()
                
    elif scene_name == "dashboard":
        tasks_df = app_state.data.get("tasks")
        payload["task_buckets"] = bucket_tasks(tasks_df, operator_id)
        
    elif scene_name == "task_start_eta":
        try:
            features = build_eta_features(task_id, app_state)
            prediction = predict_eta(features)
            payload["eta"] = prediction
        except Exception as e:
            payload["eta_error"] = str(e)
            
    elif scene_name == "idle_moment":
        idle_events = app_state.data.get("idle_events")
        if idle_events is not None and not idle_events.empty:
            task_events = idle_events[idle_events['task_id'] == task_id]
            if not task_events.empty:
                payload["active_idle_event"] = task_events.iloc[0].to_dict()
                
    elif scene_name == "condition_change_eta_recalc":
        try:
            features = build_eta_features(task_id, app_state)
            features["ground_condition"] = "wet"  # Force condition change
            prediction = predict_eta(features)
            
            baseline_eta = 120.0
            explanation = explain_eta_change(baseline_eta, prediction["eta_minutes"], features)
            
            payload["new_eta"] = prediction
            payload["explanation"] = explanation
        except Exception as e:
            payload["eta_error"] = str(e)
            
    elif scene_name == "safety_event":
        telemetry = app_state.data.get("telemetry")
        if telemetry is not None and not telemetry.empty:
            golden = telemetry[(telemetry['task_id'] == task_id) & (telemetry['is_golden'] == True)]
            if not golden.empty:
                # Force seatbelt unfastened for the demo
                row = golden.iloc[-1].to_dict()
                row["seatbelt_status"] = "unfastened"
                payload["safety_evaluation"] = evaluate_safety(row)
        
        safety_events = app_state.data.get("safety_events")
        if safety_events is not None and not safety_events.empty:
            summary = summarize_safety_event(safety_events, "SE001")
            payload["incident_summary"] = summary
            
    elif scene_name == "task_complete_behavior_insight":
        try:
            features = build_behavior_features(task_id, app_state)
            features["idling_time_min"] = 30 # Trigger anomalous behavior manually
            prediction = predict_behavior(features)
            payload["behavior"] = prediction
        except Exception as e:
            payload["behavior_error"] = str(e)
            
    elif scene_name == "training_recommendation":
        training = app_state.data.get("training_content")
        if training is not None and not training.empty:
            payload["training_content"] = training.to_dict(orient="records")
            
    elif scene_name == "handover_resume":
        payload["resume_briefing"] = build_resume_briefing(
            task_name="Morning Excavation",
            zone="Zone A",
            progress_pct=85.5,
            cycles_completed=34,
            total_cycles=40,
            ground_condition="wet",
            last_note="Operator checked radio"
        )
        
    return payload
