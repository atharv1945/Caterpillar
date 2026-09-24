import os
import logging
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Safe key-presence check — NEVER log the key value itself
logging.getLogger(__name__).info(
    "GEMINI_API_KEY loaded: %s", "true" if GEMINI_API_KEY else "false (Gemini fallbacks will be used)"
)

# Golden row count config for telemetry
GOLDEN_ROW_COUNT = 18

# Note for ML team: The future `predict_eta` and `predict_behavior` models
# should be imported here or in data_loader once Phase 2 begins.
# The contract signature is:
# predict_eta(features: dict) -> {"eta_minutes": float, "source": "model" | "fallback"}
# predict_behavior(features: dict) -> {"is_anomalous": bool, "score": float, "source": "model" | "fallback"}
