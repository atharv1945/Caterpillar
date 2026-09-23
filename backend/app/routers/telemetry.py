from fastapi import APIRouter, HTTPException, Request
from app.schemas import TelemetryOut
from app.filters import latest_golden_row

router = APIRouter()

@router.get("/latest", response_model=TelemetryOut)
def get_latest_telemetry(request: Request, task_id: str):
    df = request.app.state.data.get("telemetry")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Telemetry data not found")
        
    row = latest_golden_row(df, task_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"No golden telemetry found for task {task_id}")
        
    # Pydantic will ignore extra fields by default, but we can explicitly pop it just in case
    row.pop('is_golden', None)
    return row
