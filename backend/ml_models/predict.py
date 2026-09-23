import os
import sys
import importlib.util

# Load the real ML teammate's predict.py from the repository root
root_predict_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "predict.py"))

spec = importlib.util.spec_from_file_location("root_ml_models_predict", root_predict_path)
root_predict = importlib.util.module_from_spec(spec)
sys.modules["root_ml_models_predict"] = root_predict
spec.loader.exec_module(root_predict)

# Export the exact Phase 4 signatures
predict_eta = root_predict.predict_eta
predict_behavior = root_predict.predict_behavior
