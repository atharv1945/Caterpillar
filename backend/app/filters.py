import pandas as pd

def golden_only(telemetry_df: pd.DataFrame) -> pd.DataFrame:
    """Returns only rows where is_golden == True."""
    if 'is_golden' not in telemetry_df.columns:
        return pd.DataFrame(columns=telemetry_df.columns)
    
    return telemetry_df[telemetry_df['is_golden'] == True]

def latest_golden_row(telemetry_df: pd.DataFrame, task_id: str) -> dict | None:
    """Returns the single most recent golden row for a task_id (by timestamp), or None if none exists."""
    golden_df = golden_only(telemetry_df)
    task_df = golden_df[golden_df['task_id'] == task_id]
    
    if task_df.empty:
        return None
        
    # Sort by timestamp descending
    task_df = task_df.sort_values(by='timestamp', ascending=False)
    
    # Return the first row as a dict
    return task_df.iloc[0].to_dict()
