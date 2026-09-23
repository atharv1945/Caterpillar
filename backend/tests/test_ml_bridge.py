from app.ml_bridge import build_eta_features, build_behavior_features

def test_build_eta_features():
    # To unit test this purely, we'd mock the app_state.data.
    # Instead, we can use the seeded data to verify the shape.
    class MockState:
        pass
    
    import pandas as pd
    app_state = MockState()
    # Mocking data to be completely self-contained pure unit test
    app_state.data = {
        "telemetry": pd.DataFrame([{
            "timestamp": "2024-10-01 08:00:00",
            "task_id": "TSK001",
            "is_golden": True,
            "idling_time_min": 15,
            "load_cycles": 10,
            "engine_hours": 1200.5,
            "weather_condition": "clear",
            "ground_condition": "dry",
            "fuel_used_l": 5.0,
            "seatbelt_status": "fastened",
            "proximity_alert": False
        }])
    }
    
    features = build_eta_features("TSK001", app_state)
    expected_keys = {
        "task_id", "idling_time_min", "load_cycles", "engine_hours", 
        "weather_condition", "ground_condition", "fuel_used_l", 
        "seatbelt_status", "proximity_alert"
    }
    
    assert set(features.keys()) == expected_keys
    assert features["idling_time_min"] == 15.0
    
def test_eta_endpoint(client):
    res = client.get("/tasks/TSK001/eta")
    assert res.status_code == 200
    data = res.json()
    assert "eta_minutes" in data
    assert "explanation" in data
    assert data["task_id"] == "TSK001"

def test_behavior_endpoint(client):
    res = client.get("/tasks/TSK001/behavior_insight")
    assert res.status_code == 200
    data = res.json()
    assert "is_anomalous" in data
    assert "score" in data
    assert "message" in data
