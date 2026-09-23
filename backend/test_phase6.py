import time
from fastapi.testclient import TestClient
from main import app

def run_tests():
    with TestClient(app) as client:
        print("=== Phase 6 Scene Orchestration Test ===")
        
        print("\n[1] POST /scene/reset")
        res = client.post("/scene/reset")
        print("Status:", res.status_code)
        print(res.json())
        
        print("\n[2] GET /scene/current (Expect Scene 0: morning_greeting)")
        res = client.get("/scene/current")
        print("Status:", res.status_code)
        data = res.json()
        print(f"Scene {data['scene_index']}: {data['scene_name']}")
        print(f"Payload Keys: {list(data['payload'].keys())}")
        
        print("\n[3] Waiting 2.1 seconds... (Sim speed: 1.0 -> 2.1 sim minutes)")
        time.sleep(2.1)
        
        print("\n[4] GET /scene/current (Expect Scene 1: dashboard)")
        res = client.get("/scene/current")
        print("Status:", res.status_code)
        data = res.json()
        print(f"Scene {data['scene_index']}: {data['scene_name']}")
        print(f"Payload Keys: {list(data['payload'].keys())}")
        
        print("\n[5] POST /scene/advance (Expect Scene 2: task_start_eta)")
        res = client.post("/scene/advance")
        print("Status:", res.status_code)
        data = res.json()
        print(f"Scene {data['scene_index']}: {data['scene_name']}")
        print(f"Payload Keys: {list(data['payload'].keys())}")
        
        print("\n[6] GET /scene/current (Should remain locked on Scene 2 due to manual_override_index)")
        res = client.get("/scene/current")
        print("Status:", res.status_code)
        data = res.json()
        print(f"Scene {data['scene_index']}: {data['scene_name']}")
        
        print("\n[7] Iterating through rest of scenes with /advance to verify payload assemblies...")
        while data['scene_index'] < data['total_scenes'] - 1:
            res = client.post("/scene/advance")
            data = res.json()
            print(f"Scene {data['scene_index']}: {data['scene_name']} - Keys: {list(data['payload'].keys())}")
            
if __name__ == "__main__":
    run_tests()
