import pandas as pd
from fastapi.testclient import TestClient
from main import app
from ml_models.predict import predict_eta, predict_behavior
from app.ml_bridge import build_eta_features, build_behavior_features

def run_tests():
    print("=== Testing features extraction ===")
    # Create fake app.state object
    class FakeState:
        data = {
            "telemetry": pd.DataFrame([{
                "task_id": "TSK001",
                "timestamp": "2026-09-24T00:00:00Z",
                "is_golden": True,
                "idling_time_min": 10.5,
                "load_cycles": 5,
                "engine_hours": 1200.5,
                "weather_condition": "sunny",
                "ground_condition": "dry",
                "fuel_used_l": 50.0,
                "seatbelt_status": "buckled",
                "proximity_alert": False
            }])
        }
    
    state = FakeState()
    features = build_eta_features("TSK001", state)
    
    expected_keys = {"task_id", "idling_time_min", "load_cycles", "engine_hours", 
                     "weather_condition", "ground_condition", "fuel_used_l", 
                     "seatbelt_status", "proximity_alert"}
                     
    assert set(features.keys()) == expected_keys, f"Keys mismatch! Expected {expected_keys}, got {set(features.keys())}"
    print("Features dict keys test: PASS")
    
    print("\n=== Testing predict functions ===")
    eta_res = predict_eta(features)
    assert "eta_minutes" in eta_res and "source" in eta_res, "predict_eta missing keys"
    assert eta_res["source"] == "fallback", "predict_eta source must be fallback"
    print("predict_eta test: PASS")
    
    beh_res = predict_behavior(features)
    assert "is_anomalous" in beh_res and "score" in beh_res and "source" in beh_res, "predict_behavior missing keys"
    assert beh_res["source"] == "fallback", "predict_behavior source must be fallback"
    print("predict_behavior test: PASS")
    
    print("\n=== Testing endpoints (TestClient) ===")
    with TestClient(app) as client:
        res = client.get("/tasks/TSK001/eta")
        print(f"GET /tasks/TSK001/eta -> {res.status_code}")
        print(res.json())
        
        res_b = client.get("/tasks/TSK001/behavior_insight")
        print(f"GET /tasks/TSK001/behavior_insight -> {res_b.status_code}")
        print(res_b.json())

if __name__ == "__main__":
    run_tests()
