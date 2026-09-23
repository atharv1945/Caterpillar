from fastapi import APIRouter, HTTPException, Request
from app.schemas import EtaOut
from app.ml_bridge import build_eta_features, explain_eta_change
from ml_models.predict import predict_eta
import pandas as pd

router = APIRouter()

@router.get("/{task_id}/eta", response_model=EtaOut)
def get_eta(task_id: str, request: Request):
    try:
        features = build_eta_features(task_id, request.app.state)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    prediction = predict_eta(features)
    new_eta = prediction["eta_minutes"]
    
    df_tasks = request.app.state.data.get("tasks")
    baseline_eta = 120.0
    if df_tasks is not None and not df_tasks.empty:
        task_rows = df_tasks[df_tasks['task_id'] == task_id]
        if not task_rows.empty:
            task_row = task_rows.iloc[0]
            start = task_row.get("scheduled_start")
            end = task_row.get("scheduled_end")
            if pd.notna(start) and pd.notna(end):
                try:
                    s_time = pd.to_datetime(start)
                    e_time = pd.to_datetime(end)
                    baseline_eta = (e_time - s_time).total_seconds() / 60.0
                except:
                    pass
                    
    explanation = explain_eta_change(baseline_eta, new_eta, features)
    
    return {
        "task_id": task_id,
        "eta_minutes": new_eta,
        "source": prediction.get("source", "fallback"),
        "explanation": explanation
    }
