from pydantic import BaseModel, model_validator
from typing import Optional, List, Any, Literal
import math

class BaseSchema(BaseModel):
    @model_validator(mode='before')
    @classmethod
    def clean_nans(cls, data: Any) -> Any:
        if isinstance(data, dict):
            import pandas as pd
            cleaned = {}
            for k, v in data.items():
                if pd.isna(v):
                    cleaned[k] = None
                else:
                    cleaned[k] = v
            return cleaned
        return data

class OperatorOut(BaseSchema):
    operator_id: str
    name: str
    preferred_language: Optional[str] = None

class TaskOut(BaseSchema):
    task_id: str
    machine_id: str
    operator_id: str
    task_name: str
    zone: Optional[str] = None
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    status: str

class TelemetryOut(BaseSchema):
    timestamp: str
    machine_id: str
    operator_id: str
    task_id: str
    engine_hours: Optional[float] = None
    fuel_used_l: Optional[float] = None
    load_cycles: Optional[int] = None
    idling_time_min: Optional[float] = None
    seatbelt_status: Optional[str] = None
    proximity_alert: Optional[bool] = None
    weather_condition: Optional[str] = None
    ground_condition: Optional[str] = None

class MachineOut(BaseSchema):
    machine_id: str
    machine_type: str

class DashboardResponse(BaseSchema):
    now: Optional[TaskOut] = None
    next: Optional[TaskOut] = None
    later: List[TaskOut] = []

class SafetyAlertOut(BaseSchema):
    triggered: bool
    severity: str
    message: str
    task_id: str
    timestamp: str

class IdleEventOut(BaseSchema):
    idle_event_id: str
    machine_id: str
    operator_id: str
    task_id: str
    idle_start: str
    idle_end: Optional[str] = None
    duration_min: Optional[int] = None
    idle_reason_code: Optional[str] = None
    reason_source: Optional[str] = None

class IdleReasonIn(BaseSchema):
    reason_code: Literal[
        "waiting_truck_material", 
        "waiting_instructions", 
        "mechanical_issue", 
        "weather_site_condition", 
        "scheduled_break", 
        "other"
    ]

class CheckpointIn(BaseSchema):
    progress_pct: float
    cycles_completed: int
    notes: Optional[str] = None
    event_type: Literal["pause", "handover", "auto"]

class CheckpointOut(BaseSchema):
    task_id: str
    checkpoint_time: str
    progress_pct: float
    cycles_completed: int
    notes: Optional[str] = None
    event_type: str
    operator_id: str

class ResumeBriefingOut(BaseSchema):
    task_id: str
    task_name: str
    zone: Optional[str] = None
    progress_pct: float
    cycles_completed: int
    total_cycles: Optional[int] = None
    ground_condition: Optional[str] = None
    last_note: Optional[str] = None
    briefing_sentence: str

class IncidentLogIn(BaseSchema):
    note: Optional[str] = None

class IncidentOut(BaseSchema):
    event_id: str
    machine_id: str
    operator_id: str
    timestamp: str
    event_type: str
    severity: str
    resolved: bool
    note: Optional[str] = None

class EtaOut(BaseSchema):
    task_id: str
    eta_minutes: float
    source: str
    explanation: str

class BehaviorInsightOut(BaseSchema):
    task_id: str
    is_anomalous: bool
    score: float
    source: str
    message: str
