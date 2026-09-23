from fastapi import APIRouter, HTTPException, Request
from app.schemas import IdleEventOut, IdleReasonIn
import pandas as pd
from datetime import datetime
from app.store import update_row, persist

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
        
    if not (df['idle_event_id'] == idle_event_id).any():
        raise HTTPException(status_code=404, detail=f"Idle event {idle_event_id} not found")
        
    updates = {
        'idle_reason_code': reason.reason_code,
        'reason_source': "operator"
    }
    
    current_end = df.loc[df['idle_event_id'] == idle_event_id, 'idle_end'].values[0]
    if pd.isna(current_end) or current_end == "":
        updates['idle_end'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
    updated_df = update_row(df, 'idle_event_id', idle_event_id, updates)
    request.app.state.data["idle_events"] = updated_df
    
    # Persist back to CSV (for hackathon persistence)
    try:
        persist(updated_df, "idle_events.csv")
    except Exception as e:
        print(f"Failed to persist idle events: {e}")
        
    updated_row = updated_df[updated_df['idle_event_id'] == idle_event_id].iloc[0]
    return updated_row.to_dict()
