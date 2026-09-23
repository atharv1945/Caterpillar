from fastapi import APIRouter, HTTPException, Request
from app.schemas import SafetyAlertOut, IncidentLogIn, IncidentOut, SummaryOut
from app.filters import latest_golden_row
from app.rules import evaluate_safety
from app.store import update_row, persist

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

@router.post("/events/{event_id}/log_incident", response_model=IncidentOut)
def log_incident(event_id: str, incident: IncidentLogIn, request: Request):
    df = request.app.state.data.get("safety_events")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Safety events data not found")
        
    if not (df['event_id'] == event_id).any():
        raise HTTPException(status_code=404, detail=f"Safety event {event_id} not found")
        
    # TODO: Gemini summarization of the incident will be added here in Phase 5
    
    updates = {
        'resolved': True,
        'note': incident.note
    }
    
    updated_df = update_row(df, 'event_id', event_id, updates)
    request.app.state.data["safety_events"] = updated_df
    
    try:
        persist(updated_df, "safety_events.csv")
    except Exception as e:
        print(f"Failed to persist safety events: {e}")
        
    updated_row = updated_df[updated_df['event_id'] == event_id].iloc[0]
    return updated_row.to_dict()

@router.get("/events/{event_id}", response_model=IncidentOut)
def get_incident(event_id: str, request: Request):
    df = request.app.state.data.get("safety_events")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Safety events data not found")
        
    events = df[df['event_id'] == event_id]
    if events.empty:
        raise HTTPException(status_code=404, detail=f"Safety event {event_id} not found")
        
    return events.iloc[0].to_dict()

def summarize_safety_event(df, event_id: str) -> dict:
    from app.schemas import SummaryOut
    from app import gemini_client
    
    events = df[df['event_id'] == event_id]
    if events.empty:
        return None
        
    row = events.iloc[0].to_dict()
    prompt = f"""Write a one-paragraph summary of the following safety incident:
Event Type: {row.get('event_type')}
Severity: {row.get('severity')}
Machine ID: {row.get('machine_id')}
Timestamp: {row.get('timestamp')}
Operator Note: {row.get('note', 'None')}
"""
    try:
        summary = gemini_client.call_gemini(prompt)
        return {"event_id": event_id, "summary": summary.strip(), "source": "gemini"}
    except gemini_client.GeminiUnavailable:
        summary = f"At {row.get('timestamp')}, a {row.get('severity')} {row.get('event_type')} was detected on {row.get('machine_id')}. Operator note: {row.get('note', 'None')}."
        return {"event_id": event_id, "summary": summary, "source": "fallback"}

@router.post("/events/{event_id}/summarize", response_model=SummaryOut)
def summarize_incident(event_id: str, request: Request):
    df = request.app.state.data.get("safety_events")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Safety events data not found")
        
    result = summarize_safety_event(df, event_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Safety event {event_id} not found")
        
    return result

