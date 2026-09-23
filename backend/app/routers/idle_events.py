from fastapi import APIRouter, HTTPException, Request
from app.schemas import IdleEventOut, IdleReasonIn
import pandas as pd
from datetime import datetime
import os
from app.config import DATA_DIR

router = APIRouter()

@router.get("/active", response_model=IdleEventOut)
def get_active_idle_event(request: Request, task_id: str):
    df = request.app.state.data.get("idle_events")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Idle events data not found")
        
    task_events = df[df['task_id'] == task_id]
    if task_events.empty:
        raise HTTPException(status_code=404, detail="No active idle event found")
        
    # Filter for empty/null idle_end
    active = task_events[task_events['idle_end'].isna() | (task_events['idle_end'] == "")]
    if active.empty:
        raise HTTPException(status_code=404, detail="No active idle event found")
        
    return active.iloc[0].to_dict()

@router.post("/{idle_event_id}/reason", response_model=IdleEventOut)
def update_idle_reason(idle_event_id: str, reason: IdleReasonIn, request: Request):
    df = request.app.state.data.get("idle_events")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Idle events data not found")
        
    idx = df[df['idle_event_id'] == idle_event_id].index
    if len(idx) == 0:
        raise HTTPException(status_code=404, detail=f"Idle event {idle_event_id} not found")
        
    row_idx = idx[0]
    
    # Update in memory
    df.at[row_idx, 'idle_reason_code'] = reason.reason_code
    df.at[row_idx, 'reason_source'] = "operator"
    
    current_end = df.at[row_idx, 'idle_end']
    if pd.isna(current_end) or current_end == "":
        df.at[row_idx, 'idle_end'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
    # Persist back to CSV (for hackathon persistence)
    try:
        csv_path = os.path.join(DATA_DIR, "idle_events.csv")
        df.to_csv(csv_path, index=False)
    except Exception as e:
        print(f"Failed to persist idle events: {e}")
        
    return df.loc[row_idx].to_dict()
