import os
import pandas as pd
from app.config import DATA_DIR

def update_row(df: pd.DataFrame, id_column: str, id_value: str, updates: dict) -> pd.DataFrame:
    """Finds the row by id, applies updates, returns the modified DataFrame."""
    idx = df[df[id_column] == id_value].index
    if len(idx) > 0:
        for k, v in updates.items():
            if k in df.columns and isinstance(v, str) and pd.api.types.is_numeric_dtype(df[k]):
                df[k] = df[k].astype(object)
            df.at[idx[0], k] = v
    return df

def append_row(df: pd.DataFrame, new_row: dict) -> pd.DataFrame:
    """Appends a new row to the DataFrame."""
    new_df = pd.DataFrame([new_row])
    # Ignore index keeps indices clean
    if df.empty:
        return new_df
    # Using pd.concat for appending
    return pd.concat([df, new_df], ignore_index=True)

def persist(df: pd.DataFrame, csv_filename: str):
    """Writes the DataFrame back to its CSV file."""
    csv_path = os.path.join(DATA_DIR, csv_filename)
    df.to_csv(csv_path, index=False)
