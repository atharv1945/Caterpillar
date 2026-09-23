from fastapi import APIRouter, HTTPException, Request
from app.schemas import SafetyAlertOut
from app.filters import latest_golden_row
from app.rules import evaluate_safety

router = APIRouter()

@router.get("/check", response_model=SafetyAlertOut)
def check_safety(request: Request, task_id: str):
    df = request.app.state.data.get("telemetry")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Telemetry data not found")
        
    row = latest_golden_row(df, task_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"No golden telemetry found for task {task_id}")
        
    result = evaluate_safety(row)
    
    return {
        "triggered": result["triggered"],
        "severity": result["severity"],
        "message": result["message"],
        "task_id": task_id,
        "timestamp": str(row.get("timestamp", ""))
    }

@router.get("/events")
def list_safety_events(request: Request, machine_id: str = None, operator_id: str = None):
    df = request.app.state.data.get("safety_events")
    if df is None or df.empty:
        return []
        
    if machine_id:
        df = df[df['machine_id'] == machine_id]
    if operator_id:
        df = df[df['operator_id'] == operator_id]
        
    return df.to_dict(orient='records')
