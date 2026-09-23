from fastapi import APIRouter, HTTPException, Request
from app.schemas import CheckpointIn, CheckpointOut, ResumeBriefingOut
from app.store import append_row, persist
from app.filters import latest_golden_row
import pandas as pd
from datetime import datetime

router = APIRouter()

def build_resume_briefing(task_name: str, zone: str, progress_pct: float, cycles_completed: int, total_cycles: int = None, ground_condition: str = None, last_note: str = None) -> str:
    """Pure function to build the resume briefing sentence."""
    cycles_clause = f"{cycles_completed} of {total_cycles}" if total_cycles else f"{cycles_completed}"
    base = f"Resuming {task_name} – {zone}. {progress_pct}% complete, {cycles_clause} cycles done."
    
    if ground_condition:
        base += f" Ground condition is {ground_condition}."
        
    if last_note:
        base += f" Last note: '{last_note}'."
        
    return base

@router.post("/{task_id}/checkpoint", response_model=CheckpointOut)
def create_checkpoint(task_id: str, checkpoint: CheckpointIn, request: Request):
    df_tasks = request.app.state.data.get("tasks")
    if df_tasks is None or df_tasks.empty:
        raise HTTPException(status_code=404, detail="Tasks data not found")
        
    task_df = df_tasks[df_tasks['task_id'] == task_id]
    if task_df.empty:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
    operator_id = task_df.iloc[0]['operator_id']
    
    df_checkpoints = request.app.state.data.get("task_checkpoints")
    if df_checkpoints is None:
        df_checkpoints = pd.DataFrame()
        
    new_row = {
        "task_id": task_id,
        "checkpoint_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "progress_pct": checkpoint.progress_pct,
        "cycles_completed": checkpoint.cycles_completed,
        "notes": checkpoint.notes,
        "event_type": checkpoint.event_type,
        "operator_id": operator_id
    }
    
    updated_df = append_row(df_checkpoints, new_row)
    request.app.state.data["task_checkpoints"] = updated_df
    
    try:
        persist(updated_df, "task_checkpoints.csv")
    except Exception as e:
        print(f"Failed to persist checkpoints: {e}")
    
    return new_row

@router.get("/{task_id}/resume", response_model=ResumeBriefingOut)
def resume_task(task_id: str, request: Request):
    df_checkpoints = request.app.state.data.get("task_checkpoints")
    if df_checkpoints is None or df_checkpoints.empty:
        raise HTTPException(status_code=404, detail="Checkpoints data not found")
        
    task_checkpoints = df_checkpoints[df_checkpoints['task_id'] == task_id]
    if task_checkpoints.empty:
        raise HTTPException(status_code=404, detail=f"No checkpoints found for task {task_id}")
        
    latest_cp = task_checkpoints.sort_values(by="checkpoint_time", ascending=False).iloc[0].to_dict()
    
    df_tasks = request.app.state.data.get("tasks")
    task_df = df_tasks[df_tasks['task_id'] == task_id]
    task_name = task_df.iloc[0]['task_name'] if not task_df.empty else "Task"
    zone = task_df.iloc[0]['zone'] if not task_df.empty else "Unknown Zone"
    
    df_telemetry = request.app.state.data.get("telemetry")
    golden_row = latest_golden_row(df_telemetry, task_id) if df_telemetry is not None else None
    
    ground_cond = golden_row.get("ground_condition") if golden_row else None
    
    # We don't have total_cycles strictly defined in the CSVs so we pass None
    briefing = build_resume_briefing(
        task_name=task_name,
        zone=zone,
        progress_pct=latest_cp["progress_pct"],
        cycles_completed=latest_cp["cycles_completed"],
        total_cycles=None,
        ground_condition=ground_cond,
        last_note=latest_cp.get("notes")
    )
    
    return {
        "task_id": task_id,
        "task_name": task_name,
        "zone": zone,
        "progress_pct": latest_cp["progress_pct"],
        "cycles_completed": latest_cp["cycles_completed"],
        "total_cycles": None,
        "ground_condition": ground_cond,
        "last_note": latest_cp.get("notes"),
        "briefing_sentence": briefing
    }
