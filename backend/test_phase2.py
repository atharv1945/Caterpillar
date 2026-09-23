import urllib.request
import json
import time

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

print("\n=== Test: GET /safety/check (Clear) ===")
# Note: In our generated telemetry, TSK002 has only training rows (not golden). Wait, TSK001 is the golden task.
# Let's find a task ID or we'll just check TSK001. Our golden row for TSK001 seatbelt unfastened is at timestamp 10:00.
# The latest row for TSK001 is at timestamp 10:50 (normal, seatbelt fastened, no proximity).
# Wait, my telemetry data from Phase 0 ended with TSK001 at 10:50, which had seatbelt fastened and no proximity. So latest golden row for TSK001 is actually CLEAR.
code, res = request("GET", "/safety/check?task_id=TSK001")
print(f"Status: {code}")
print(json.dumps(res, indent=2))
assert res["severity"] == "clear"

# Let's test a POST to idle_events. We have IE001 active in task TSK001?
# Let's see if /idle_events/active?task_id=TSK001 works.
print("\n=== Test: GET /idle_events/active ===")
code, res = request("GET", "/idle_events/active?task_id=TSK001")
print(f"Status: {code}")
print(json.dumps(res, indent=2))
if code == 200:
    event_id = res["idle_event_id"]
    
    print(f"\n=== Test: POST /idle_events/{event_id}/reason (Invalid) ===")
    code, err = request("POST", f"/idle_events/{event_id}/reason", data={"reason_code": "bad_code"})
    print(f"Status: {code}")
    print(json.dumps(err, indent=2))
    assert code == 422
    
    print(f"\n=== Test: POST /idle_events/{event_id}/reason (Valid) ===")
    code, update_res = request("POST", f"/idle_events/{event_id}/reason", data={"reason_code": "waiting_truck_material"})
    print(f"Status: {code}")
    print(json.dumps(update_res, indent=2))
    assert code == 200
    assert update_res["idle_reason_code"] == "waiting_truck_material"
    
    print("\n=== Test: GET /idle_events/active (Should be 404 now) ===")
    code, res2 = request("GET", "/idle_events/active?task_id=TSK001")
    print(f"Status: {code}")
    assert code == 404
