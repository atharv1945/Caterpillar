import urllib.request
import json

def request(method, path, data=None):
    url = f"http://localhost:8000{path}"
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
        data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req, data=data) as response:
            return response.getcode(), json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except:
            return e.code, e.read().decode()

print("\n=== Test POST /tasks/TSK001/checkpoint ===")
cp_payload = {
    "progress_pct": 68.0,
    "cycles_completed": 17,
    "notes": "holding for grading crew",
    "event_type": "pause"
}
code, res = request("POST", "/tasks/TSK001/checkpoint", data=cp_payload)
print(f"Status: {code}")
print(json.dumps(res, indent=2))
assert code == 200

print("\n=== Test GET /tasks/TSK001/resume ===")
code, res = request("GET", "/tasks/TSK001/resume")
print(f"Status: {code}")
print(json.dumps(res, indent=2))
assert code == 200
assert "Resuming" in res["briefing_sentence"]

print("\n=== Test POST /safety/events/SE001/log_incident ===")
inc_payload = {"note": "Operator checked radio"}
code, res = request("POST", "/safety/events/SE001/log_incident", data=inc_payload)
print(f"Status: {code}")
print(json.dumps(res, indent=2))
assert code == 200
assert res["resolved"] == True
assert res["note"] == "Operator checked radio"
