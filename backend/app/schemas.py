from pydantic import BaseModel, model_validator
from typing import Optional, List, Any
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
