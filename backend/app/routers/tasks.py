from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from app.schemas import TaskOut, DashboardResponse
import pandas as pd

router = APIRouter()

def bucket_tasks(tasks_df: pd.DataFrame, operator_id: str) -> dict:
    """Pure function to bucket tasks for a given operator into now, next, later."""
    if tasks_df is None or tasks_df.empty:
        return {"now": None, "next": None, "later": []}
        
    op_tasks = tasks_df[tasks_df['operator_id'] == operator_id].copy()
    if op_tasks.empty:
        return {"now": None, "next": None, "later": []}
        
    # Sort by scheduled start
    op_tasks = op_tasks.sort_values(by='scheduled_start')
    
    # "now" = first "in_progress", or if none, first "scheduled"
    in_prog = op_tasks[op_tasks['status'] == 'in_progress']
    sched = op_tasks[op_tasks['status'] == 'scheduled']
    
    now_task = None
    if not in_prog.empty:
        now_task = in_prog.iloc[0].to_dict()
        op_tasks = op_tasks.drop(in_prog.index[0])
    elif not sched.empty:
        now_task = sched.iloc[0].to_dict()
        op_tasks = op_tasks.drop(sched.index[0])
        
    # "next" = the next scheduled task after "now"
    sched_remaining = op_tasks[op_tasks['status'] == 'scheduled']
    next_task = None
    if not sched_remaining.empty:
        next_task = sched_remaining.iloc[0].to_dict()
        op_tasks = op_tasks.drop(sched_remaining.index[0])
        
    # "later" = remaining scheduled tasks
    later_tasks = op_tasks[op_tasks['status'] == 'scheduled'].to_dict(orient='records')
    
    return {
        "now": now_task,
        "next": next_task,
        "later": later_tasks
    }

@router.get("", response_model=List[TaskOut])
def list_tasks(request: Request, operator_id: Optional[str] = None):
    df = request.app.state.data.get("tasks")
    if df is None or df.empty:
        return []
        
    if operator_id:
        df = df[df['operator_id'] == operator_id]
        
    return df.to_dict(orient='records')

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(request: Request, operator_id: str):
    df = request.app.state.data.get("tasks")
    buckets = bucket_tasks(df, operator_id)
    return buckets

@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, request: Request):
    df = request.app.state.data.get("tasks")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Tasks data not found")
        
    t_df = df[df['task_id'] == task_id]
    if t_df.empty:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
    return t_df.iloc[0].to_dict()
