"""
test_integration.py  —  CAT Operator AI Companion  |  Pre-Handoff Integration Test
Run from repo root:  python ml_models/test_integration.py

Covers:
  1. Artifact existence check
  2. Contract shape compliance
  3. Golden-row regression vs saved baseline
  4. Adversarial / edge-case inputs  (no exception must ever surface)
  5. Latency check (avg ms per call, flag if >200ms)
  6. Fresh-process load check via subprocess

Does NOT retrain or modify any model.
"""

import os
import sys
import json
import time
import subprocess
import traceback
import textwrap
import tempfile

# ── Paths ─────────────────────────────────────────────────────────────────
ML_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ML_DIR, "data")
BASELINE = os.path.join(ML_DIR, "golden_baseline.json")

sys.path.insert(0, ML_DIR)

# ── Result tracking ────────────────────────────────────────────────────────
_results = {}   # section_name -> True (pass) / str (fail reason)

def mark(section, ok, reason=""):
    _results[section] = True if ok else (reason or "FAILED")

def passed(section):
    return _results.get(section) is True

# ── Helpers ────────────────────────────────────────────────────────────────
SEP  = "-" * 90
SEP2 = "=" * 90

def header(title):
    print(f"\n{SEP2}")
    print(f"  {title}")
    print(SEP2)

def ok(msg):   print(f"  [PASS] {msg}")
def fail(msg): print(f"  [FAIL] {msg}")
def info(msg): print(f"  [INFO] {msg}")

# ══════════════════════════════════════════════════════════════════════════
# 1. ARTIFACT EXISTENCE
# ══════════════════════════════════════════════════════════════════════════
header("1. ARTIFACT EXISTENCE")

required = [
    os.path.join(ML_DIR, "eta_model.joblib"),
    os.path.join(ML_DIR, "behavior_model.joblib"),
    os.path.join(ML_DIR, "eta_columns.joblib"),
    os.path.join(ML_DIR, "predict.py"),
    os.path.join(ML_DIR, "requirements.txt"),
]
missing = []
for path in required:
    name = os.path.basename(path)
    if os.path.exists(path):
        size = os.path.getsize(path)
        ok(f"{name:<30}  {size:>10,} bytes")
    else:
        fail(f"{name:<30}  NOT FOUND")
        missing.append(name)

if missing:
    mark("ARTIFACTS OK", False, f"Missing: {missing}")
    print("\n[FATAL] Artifacts missing — run train.py first. Aborting.")
    sys.exit(1)
else:
    mark("ARTIFACTS OK", True)

# ══════════════════════════════════════════════════════════════════════════
# 2. CONTRACT SHAPE COMPLIANCE
# ══════════════════════════════════════════════════════════════════════════
header("2. CONTRACT SHAPE COMPLIANCE")

from predict import predict_eta, predict_behavior   # noqa: E402

GOOD_FEATURES = {
    "idling_time_min":   8.0,
    "load_cycles":       6,
    "weather_condition": "Sunny",
    "ground_condition":  "Dry",
    "engine_hours":      400.0,
    "task_id":           "TSK001",
}

contract_ok = True

def check_shape(fn, features, fn_name, expected_keys, expected_types):
    global contract_ok
    try:
        result = fn(features)
        if not isinstance(result, dict):
            fail(f"{fn_name}: return type is {type(result).__name__}, expected dict")
            contract_ok = False
            return None
        actual_keys = set(result.keys())
        if actual_keys != expected_keys:
            fail(f"{fn_name}: keys {actual_keys} != expected {expected_keys}")
            contract_ok = False
            return None
        for key, expected_type in expected_types.items():
            val = result[key]
            if not isinstance(val, expected_type):
                fail(f"{fn_name}['{key}']: got {type(val).__name__}, expected {expected_type.__name__}")
                contract_ok = False
                return None
        if result.get("source") not in ("model", "fallback"):
            fail(f"{fn_name}['source']: got '{result['source']}', must be 'model' or 'fallback'")
            contract_ok = False
            return None
        ok(f"{fn_name}: shape OK  {result}")
        return result
    except Exception as e:
        fail(f"{fn_name}: raised unexpectedly — {e}")
        contract_ok = False
        return None

check_shape(
    predict_eta, GOOD_FEATURES, "predict_eta",
    expected_keys  = {"eta_minutes", "source"},
    expected_types = {"eta_minutes": (int, float), "source": str},
)
check_shape(
    predict_behavior, GOOD_FEATURES, "predict_behavior",
    expected_keys  = {"is_anomalous", "score", "source"},
    expected_types = {"is_anomalous": bool, "score": float, "source": str},
)

mark("CONTRACT SHAPE OK", contract_ok)

# ══════════════════════════════════════════════════════════════════════════
# 3. GOLDEN-ROW REGRESSION vs BASELINE
# ══════════════════════════════════════════════════════════════════════════
header("3. GOLDEN-ROW REGRESSION CHECK")

import pandas as pd   # noqa: E402

tel    = pd.read_csv(os.path.join(DATA_DIR, "telemetry.csv"))
golden = tel[tel["is_golden"] == True].reset_index(drop=True)

current_results = []
for _, row in golden.iterrows():
    feat = {
        "idling_time_min":   float(row["idling_time_min"]),
        "load_cycles":       int(row["load_cycles"]),
        "weather_condition": str(row["weather_condition"]),
        "ground_condition":  str(row["ground_condition"]),
        "engine_hours":      float(row["engine_hours"]),
        "task_id":           str(row["task_id"]),
    }
    eta_res = predict_eta(feat)
    beh_res = predict_behavior(feat)
    current_results.append({
        "scene":       str(row["scene"]),
        "eta_minutes": eta_res["eta_minutes"],
        "eta_source":  eta_res["source"],
        "is_anomalous": beh_res["is_anomalous"],
        "beh_score":   beh_res["score"],
        "beh_source":  beh_res["source"],
    })

# Save or compare baseline
if not os.path.exists(BASELINE):
    with open(BASELINE, "w") as f:
        json.dump(current_results, f, indent=2)
    info(f"Baseline created at {BASELINE}  (18 rows saved)")
    info("Re-run to compare against this baseline.")
    mark("GOLDEN ROWS MATCH BASELINE", True)
else:
    with open(BASELINE) as f:
        baseline = json.load(f)

    diffs = []
    for i, (cur, bas) in enumerate(zip(current_results, baseline)):
        scene = cur["scene"]
        for key in ("eta_minutes", "eta_source", "is_anomalous", "beh_score", "beh_source"):
            if cur[key] != bas[key]:
                diffs.append(
                    f"  Row {i} ({scene}): [{key}]  baseline={bas[key]!r}  current={cur[key]!r}"
                )

    hdr_line = (f"{'#':<3} {'scene':<26} {'eta_min':>8} {'eta_src':<10} "
                f"{'anomalous':>9} {'beh_score':>10} {'beh_src'}")
    print(f"\n{hdr_line}")
    print(SEP)
    for i, r in enumerate(current_results):
        print(f"{i:<3} {r['scene']:<26} {r['eta_minutes']:>8.1f} {r['eta_source']:<10} "
              f"{'YES' if r['is_anomalous'] else 'no':>9} {r['beh_score']:>10.4f} {r['beh_source']}")
    print()

    if diffs:
        fail(f"{len(diffs)} difference(s) vs baseline:")
        for d in diffs:
            print(d)
        mark("GOLDEN ROWS MATCH BASELINE", False, f"{len(diffs)} drift(s) detected — see above")
    else:
        ok(f"All 18 golden rows exactly match {os.path.basename(BASELINE)}")
        mark("GOLDEN ROWS MATCH BASELINE", True)

# ══════════════════════════════════════════════════════════════════════════
# 4. ADVERSARIAL / EDGE-CASE INPUTS
# ══════════════════════════════════════════════════════════════════════════
header("4. ADVERSARIAL / EDGE-CASE INPUTS")

# Each entry: (label, input, expect_fallback_eta, expect_fallback_beh)
#   expect_fallback_*: True  = must return "fallback"
#                      False = model may return "model" (graceful handling)
#                      None  = don't care
EDGE_CASES = [
    # label,                              features_or_sentinel,              fb_eta, fb_beh
    ("missing key (no idling_time_min)",  {k: v for k, v in GOOD_FEATURES.items()
                                           if k != "idling_time_min"},        True,  True),
    ("wrong type (idling='not_a_number')",{**GOOD_FEATURES,
                                           "idling_time_min": "not_a_number"}, True, True),
    ("out-of-range values (-50/9999/-1)", {**GOOD_FEATURES,
                                           "idling_time_min": -50,
                                           "load_cycles": 9999,
                                           "engine_hours": -1},               None,  None),
    ("unseen category (Tornado/UNKNOWN)", {**GOOD_FEATURES,
                                           "weather_condition": "Tornado",
                                           "task_id": "TASK_UNKNOWN_999"},    None,  None),
    ("empty dict {}",                     {},                                  True,  True),
    ("None instead of dict",              None,                                True,  True),
]

edge_col_w = [42, 18, 16, 10, 18, 14, 18]
def edge_hdr():
    print(f"  {'input case':<42} {'function':<18} {'exception?':<16} "
          f"{'source':<10} {'value':<18} {'verdict'}")
    print("  " + SEP)

edge_hdr()
all_edge_ok = True

def run_edge(label, inp, fn, fn_name, expect_fallback):
    global all_edge_ok
    exc_raised = False
    source     = "N/A"
    value      = "N/A"
    verdict    = "PASS"
    try:
        result = fn(inp)
        source = result.get("source", "N/A")
        if fn_name == "predict_eta":
            value = str(result.get("eta_minutes"))
        else:
            value = f"anom={result.get('is_anomalous')} s={result.get('score')}"
    except Exception as e:
        exc_raised = True
        source     = "EXCEPTION"
        value      = repr(e)[:40]

    # Evaluate
    if exc_raised:
        verdict = "FAIL -- exception raised"
        all_edge_ok = False
    elif expect_fallback is True and source != "fallback":
        verdict = f"FAIL -- expected fallback, got '{source}'"
        all_edge_ok = False

    pfx = "  " if verdict == "PASS" else "  "
    print(f"  {label:<42} {fn_name:<18} {'YES -- BAD' if exc_raised else 'No':<16} "
          f"{source:<10} {value[:18]:<18} {verdict}")

for label, inp, fb_eta, fb_beh in EDGE_CASES:
    run_edge(label, inp, predict_eta,      "predict_eta",      fb_eta)
    run_edge(label, inp, predict_behavior, "predict_behavior",  fb_beh)
    print()

mark("EDGE CASES HANDLED (no exceptions)", all_edge_ok)

# ══════════════════════════════════════════════════════════════════════════
# 5. LATENCY CHECK
# ══════════════════════════════════════════════════════════════════════════
header("5. LATENCY CHECK (100 calls each)")

LATENCY_THRESHOLD_MS = 200.0
N = 100

t0 = time.perf_counter()
for _ in range(N):
    predict_eta(GOOD_FEATURES)
eta_ms = (time.perf_counter() - t0) / N * 1000

t0 = time.perf_counter()
for _ in range(N):
    predict_behavior(GOOD_FEATURES)
beh_ms = (time.perf_counter() - t0) / N * 1000

eta_ok_flag = eta_ms < LATENCY_THRESHOLD_MS
beh_ok_flag = beh_ms < LATENCY_THRESHOLD_MS

print(f"\n  predict_eta      avg: {eta_ms:.2f} ms/call   "
      f"({'OK' if eta_ok_flag else 'SLOW -- >' + str(LATENCY_THRESHOLD_MS) + 'ms'})")
print(f"  predict_behavior avg: {beh_ms:.2f} ms/call   "
      f"({'OK' if beh_ok_flag else 'SLOW -- >' + str(LATENCY_THRESHOLD_MS) + 'ms'})")

latency_ok = eta_ok_flag and beh_ok_flag
if latency_ok:
    ok("Both functions well under 200 ms/call threshold")
else:
    fail("One or more functions exceeded 200 ms — Backend same-process call may lag")
mark("LATENCY OK", latency_ok,
     f"eta={eta_ms:.1f}ms beh={beh_ms:.1f}ms (threshold={LATENCY_THRESHOLD_MS}ms)")

# ══════════════════════════════════════════════════════════════════════════
# 6. FRESH-PROCESS CHECK
# ══════════════════════════════════════════════════════════════════════════
header("6. FRESH-PROCESS LOAD CHECK (subprocess)")

_probe_script = textwrap.dedent(f"""\
import sys, json
sys.path.insert(0, {repr(ML_DIR)})
from predict import predict_eta, predict_behavior
features = {repr(GOOD_FEATURES)}
eta = predict_eta(features)
beh = predict_behavior(features)
out = {{"eta": eta, "beh": beh}}
print(json.dumps(out))
""")

fresh_ok = False
try:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py",
                                     delete=False, dir=ML_DIR) as tmp:
        tmp.write(_probe_script)
        tmp_path = tmp.name

    proc = subprocess.run(
        [sys.executable, tmp_path],
        capture_output=True, text=True, timeout=30,
    )
    os.unlink(tmp_path)

    if proc.returncode != 0:
        fail(f"Subprocess exited {proc.returncode}")
        print(f"  stderr: {proc.stderr.strip()[:400]}")
    else:
        out = json.loads(proc.stdout.strip())
        eta_src = out["eta"]["source"]
        beh_src = out["beh"]["source"]
        eta_val = out["eta"]["eta_minutes"]
        beh_anom = out["beh"]["is_anomalous"]
        ok(f"Fresh process loaded models successfully")
        ok(f"  predict_eta      -> eta_minutes={eta_val}, source='{eta_src}'")
        ok(f"  predict_behavior -> is_anomalous={beh_anom}, source='{beh_src}'")
        if eta_src == "fallback" or beh_src == "fallback":
            fail("Fresh process returned 'fallback' — joblib artifacts may be corrupt or missing")
        else:
            fresh_ok = True

except subprocess.TimeoutExpired:
    fail("Subprocess timed out after 30 s — model load is too slow")
except json.JSONDecodeError as e:
    fail(f"Could not parse subprocess output as JSON: {e}")
    print(f"  stdout was: {proc.stdout[:300]}")
except Exception as e:
    fail(f"Unexpected error during fresh-process check: {e}")
    traceback.print_exc()

mark("FRESH-PROCESS OK", fresh_ok)

# ══════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ══════════════════════════════════════════════════════════════════════════
print(f"\n{SEP2}")
print("  FINAL SUMMARY")
print(SEP2)

sections = [
    "ARTIFACTS OK",
    "CONTRACT SHAPE OK",
    "GOLDEN ROWS MATCH BASELINE",
    "EDGE CASES HANDLED (no exceptions)",
    "LATENCY OK",
    "FRESH-PROCESS OK",
]

all_pass = True
for s in sections:
    result = _results.get(s, "NOT RUN")
    if result is True:
        print(f"  [PASS] {s}")
    else:
        all_pass = False
        print(f"  [FAIL] {s}")
        if isinstance(result, str):
            print(f"         Fix needed: {result}")

print()
if all_pass:
    print("  ALL CHECKS PASSED. Models are demo-ready for Backend handoff.")
else:
    print("  ONE OR MORE CHECKS FAILED. Review items above before handoff.")
print(SEP2)

sys.exit(0 if all_pass else 1)
