def predict_eta(features: dict) -> dict:
    return {"eta_minutes": 999.9, "source": "dummy_model"}

def predict_behavior(features: dict) -> dict:
    return {"is_anomalous": True, "score": 0.99, "source": "dummy_model"}
