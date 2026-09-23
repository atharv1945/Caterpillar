import urllib.request
import json

def get(path):
    url = f"http://localhost:8000{path}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "detail": json.loads(e.read().decode())}

print("=== Operator ===")
print(json.dumps(get("/operators/OP1001"), indent=2))

print("\n=== Machine ===")
print(json.dumps(get("/machines/EXC001"), indent=2))

print("\n=== Tasks Dashboard ===")
print(json.dumps(get("/tasks/dashboard?operator_id=OP1001"), indent=2))

print("\n=== Latest Golden Telemetry ===")
print(json.dumps(get("/telemetry/latest?task_id=TSK001"), indent=2))
