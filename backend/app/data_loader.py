import os
import pandas as pd
from .config import DATA_DIR

def load_all():
    """
    Loads all 8 CSVs from app/data/ into pandas DataFrames.
    Returns a dictionary keyed by table name.
    """
    tables = [
        "operators",
        "machines",
        "tasks",
        "telemetry",
        "idle_events",
        "task_checkpoints",
        "safety_events",
        "training_content"
    ]
    
    data = {}
    for table in tables:
        csv_path = os.path.join(DATA_DIR, f"{table}.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            data[table] = df
            print(f"Loaded {table}.csv: {df.shape[0]} rows, {df.shape[1]} columns")
        else:
            print(f"Warning: {table}.csv not found at {csv_path}")
            data[table] = pd.DataFrame()
            
    return data
