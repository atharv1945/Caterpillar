# MOCK — replace this file with ML teammate's trained predict.py; signature must not change.

def predict_eta(features: dict) -> dict:
    """
    features keys (must match telemetry.csv columns): task_id, 
    idling_time_min, load_cycles, engine_hours, weather_condition, 
    ground_condition, fuel_used_l, seatbelt_status, proximity_alert
    Returns: {"eta_minutes": float, "source": "model" | "fallback"}
    """
    # Pseudo-ETA calculation for mock
    base_time = 120.0
    
    # Simple heuristics
    idling_time = float(features.get('idling_time_min', 0))
    cycles = int(features.get('load_cycles', 0))
    
    eta = base_time + idling_time - (cycles * 2.5)
    
    # Small penalty for wet ground
    if features.get('ground_condition', '').lower() == 'wet':
        eta += 15.0
        
    # Ensure ETA is non-negative
    eta = max(5.0, eta)
    
    return {
        "eta_minutes": round(eta, 1),
        "source": "fallback"
    }

def predict_behavior(features: dict) -> dict:
    """
    features keys: same telemetry-derived dict as above, plus whatever 
    idle/load-cycle aggregates are cheap to compute.
    Returns: {"is_anomalous": bool, "score": float, "source": "model" | "fallback"}
    """
    idling_time = float(features.get('idling_time_min', 0))
    
    # Simple heuristic: anomalous if idling > 30 minutes
    is_anomalous = idling_time > 30.0
    score = min(idling_time / 60.0, 1.0)
    
    return {
        "is_anomalous": is_anomalous,
        "score": round(score, 2),
        "source": "fallback"
    }
