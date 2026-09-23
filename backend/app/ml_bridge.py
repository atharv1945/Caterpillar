import pandas as pd
from app.filters import latest_golden_row
from ml_models.predict import predict_eta, predict_behavior

def build_eta_features(task_id: str, app_state) -> dict:
    df_telemetry = app_state.data.get("telemetry")
    if df_telemetry is None or df_telemetry.empty:
        raise ValueError("Telemetry data not found")
        
    row = latest_golden_row(df_telemetry, task_id)
    if row is None:
        raise ValueError(f"Telemetry not found for task {task_id}")
    
    return {
        "task_id": str(row.get("task_id", "")),
        "idling_time_min": float(row.get("idling_time_min", 0.0) if pd.notna(row.get("idling_time_min")) else 0.0),
        "load_cycles": int(row.get("load_cycles", 0) if pd.notna(row.get("load_cycles")) else 0),
        "engine_hours": float(row.get("engine_hours", 0.0) if pd.notna(row.get("engine_hours")) else 0.0),
        "weather_condition": str(row.get("weather_condition", "") if pd.notna(row.get("weather_condition")) else ""),
        "ground_condition": str(row.get("ground_condition", "") if pd.notna(row.get("ground_condition")) else ""),
        "fuel_used_l": float(row.get("fuel_used_l", 0.0) if pd.notna(row.get("fuel_used_l")) else 0.0),
        "seatbelt_status": str(row.get("seatbelt_status", "") if pd.notna(row.get("seatbelt_status")) else ""),
        "proximity_alert": bool(row.get("proximity_alert", False) if pd.notna(row.get("proximity_alert")) else False)
    }

def build_behavior_features(task_id: str, app_state) -> dict:
    return build_eta_features(task_id, app_state)

def explain_eta_change(old_eta: float, new_eta: float, features: dict) -> str:
    delta = round(new_eta - old_eta, 1)
    if features.get("ground_condition", "").lower() == "wet" and new_eta > old_eta:
        return f"Ground got wet, cycle time increased — {delta} minutes added."
    return "ETA updated based on current progress."
