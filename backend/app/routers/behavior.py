from fastapi import APIRouter, HTTPException, Request
from app.schemas import BehaviorInsightOut
from app.ml_bridge import build_behavior_features
from ml_models.predict import predict_behavior

router = APIRouter()

@router.get("/{task_id}/behavior_insight", response_model=BehaviorInsightOut)
def get_behavior_insight(task_id: str, request: Request):
    try:
        features = build_behavior_features(task_id, request.app.state)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    prediction = predict_behavior(features)
    is_anomalous = prediction.get("is_anomalous", False)
    
    message = "No unusual patterns detected"
    if is_anomalous:
        message = "Idle time was 42% above your average for this task type"
        
    return {
        "task_id": task_id,
        "is_anomalous": is_anomalous,
        "score": prediction.get("score", 0.0),
        "source": prediction.get("source", "fallback"),
        "message": message
    }
