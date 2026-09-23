"""
train.py  —  CAT Operator AI Companion  |  ML Training Script
Trains on the 50 non-golden telemetry rows ONLY (is_golden=False).
Saves: eta_model.joblib, behavior_model.joblib, eta_columns.joblib
"""

import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.metrics import mean_absolute_error
import joblib

# ── Constants — MUST stay in sync with predict.py ─────────────────────────
EXPECTED_CYCLES = 8      # baseline cycles per 30-min telemetry window
BASE_CYCLE_MIN  = 8.0    # minutes / cycle under ideal (Dry + Sunny) conditions
GROUND_MULT     = {"Dry": 1.0, "Wet": 1.3, "Muddy": 1.7}
WEATHER_MULT    = {"Sunny": 1.0, "Overcast": 1.1, "Rainy": 1.2}
ETA_CLIP_MIN    = 5.0
ETA_CLIP_MAX    = 175.0  # hard ceiling applied to label during training

DATA_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))


# ── Label engineering ──────────────────────────────────────────────────────
def engineer_eta_label(df: pd.DataFrame) -> pd.Series:
    """
    Deterministic remaining-time label derived from the same correlation rules
    used in generate_dataset.py:
        - wet/muddy ground  → fewer cycles → higher cycle time → longer ETA
        - high idling       → weak additive signal
    Formula:
        remaining = 60 + (EXPECTED_CYCLES - load_cycles) * BASE_CYCLE_MIN * gm * wm
                       + idling_time_min * 0.3
    Clipped to [ETA_CLIP_MIN, ETA_CLIP_MAX].
    """
    gm = df["ground_condition"].map(GROUND_MULT).fillna(1.0)
    wm = df["weather_condition"].map(WEATHER_MULT).fillna(1.0)
    remaining = (
        60.0
        + (EXPECTED_CYCLES - df["load_cycles"]) * BASE_CYCLE_MIN * gm * wm
        + df["idling_time_min"] * 0.3
    )
    return remaining.clip(ETA_CLIP_MIN, ETA_CLIP_MAX)


# ── Feature engineering ────────────────────────────────────────────────────
def build_eta_features(df: pd.DataFrame, columns=None) -> pd.DataFrame:
    """
    Returns feature matrix for the ETA model.
    Numeric: idling_time_min, load_cycles, engine_hours
    Categorical (one-hot): weather_condition, ground_condition, task_id
    If `columns` is provided, reindex to align with training column set.
    """
    numerics = df[["idling_time_min", "load_cycles", "engine_hours"]].reset_index(drop=True)
    cats = pd.get_dummies(
        df[["weather_condition", "ground_condition", "task_id"]].reset_index(drop=True),
        prefix=["weather", "ground", "task"],
    )
    X = pd.concat([numerics, cats], axis=1)
    if columns is not None:
        X = X.reindex(columns=columns, fill_value=0)
    return X.astype(float)


# ── Main ───────────────────────────────────────────────────────────────────
def main():
    tel = pd.read_csv(os.path.join(DATA_DIR, "telemetry.csv"))
    train = tel[tel["is_golden"] == False].copy().reset_index(drop=True)
    print(f"Loaded {len(tel)} total rows  |  Training on {len(train)} non-golden rows\n")

    # ── 1. ETA Model (RandomForestRegressor) ──────────────────────────────
    y_eta = engineer_eta_label(train)
    X_eta = build_eta_features(train)
    eta_columns = list(X_eta.columns)

    eta_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=6,
        min_samples_leaf=2,
        random_state=42,
    )
    eta_model.fit(X_eta, y_eta)
    train_preds = eta_model.predict(X_eta)
    train_mae   = mean_absolute_error(y_eta, train_preds)

    print("=" * 50)
    print("ETA Model  (RandomForestRegressor)")
    print(f"  Features      : {eta_columns}")
    print(f"  Train MAE     : {train_mae:.2f} min")
    print(f"  Label range   : [{y_eta.min():.1f}, {y_eta.max():.1f}] min")
    print(f"  Pred  range   : [{train_preds.min():.1f}, {train_preds.max():.1f}] min")

    # ── 2. Behavior Model (IsolationForest) ────────────────────────────────
    # engine_hours excluded: it's a cumulative counter, not a behavioural signal,
    # and golden rows (412-420 h) exceed the training range (380-410 h) which
    # causes IsolationForest to uniformly flag everything as anomalous.
    BEH_FEATURES = ["idling_time_min", "load_cycles"]
    X_beh = train[BEH_FEATURES].values

    beh_model = IsolationForest(contamination=0.15, random_state=42, n_estimators=200)
    beh_model.fit(X_beh)

    beh_labels     = beh_model.predict(X_beh)   # -1 = anomaly, 1 = normal
    anomaly_rate   = (beh_labels == -1).mean()
    anomaly_scores = beh_model.score_samples(X_beh)

    print()
    print("=" * 50)
    print("Behavior Model  (IsolationForest, contamination=0.15)")
    print(f"  Features      : {BEH_FEATURES}")
    print(f"  Anomaly rate  : {anomaly_rate:.1%}  ({(beh_labels==-1).sum()}/{len(beh_labels)} rows flagged)")
    print(f"  Score range   : [{anomaly_scores.min():.4f}, {anomaly_scores.max():.4f}]  (lower = more anomalous)")

    # ── 3. Save artifacts ─────────────────────────────────────────────────
    joblib.dump(eta_model,   os.path.join(MODEL_DIR, "eta_model.joblib"))
    joblib.dump(beh_model,   os.path.join(MODEL_DIR, "behavior_model.joblib"))
    joblib.dump(eta_columns, os.path.join(MODEL_DIR, "eta_columns.joblib"))

    print()
    print("=" * 50)
    print("Artifacts saved:")
    for f in ["eta_model.joblib", "behavior_model.joblib", "eta_columns.joblib"]:
        path = os.path.join(MODEL_DIR, f)
        print(f"  {f:<30}  ({os.path.getsize(path):,} bytes)")
    print("\n[OK] Training complete.")


if __name__ == "__main__":
    main()
