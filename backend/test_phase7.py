from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch
import sys

def run_tests():
    with TestClient(app, raise_server_exceptions=False) as client:
        print("=== Phase 7 Readiness Test ===")
        
        print("\n[1] Testing CORS Headers")
        res = client.get("/scene/current", headers={"Origin": "http://localhost:3000"})
        print("Status:", res.status_code)
        print("Access-Control-Allow-Origin:", res.headers.get("access-control-allow-origin"))
        
        print("\n[2] Testing 404 Standardized Response")
        res = client.get("/tasks/NON_EXISTENT_TASK")
        print("Status:", res.status_code)
        print("Response:", res.json())
        
        print("\n[3] Testing 422 Standardized Validation Error")
        # trigger 422 by missing a required field or sending wrong type
        res = client.post("/safety/events/SE001/log_incident", json={"note": 12345})
        print("Status:", res.status_code)
        print("Response:", res.json())
        
        print("\n[4] Testing 500 Generic Error (Hiding Stack Trace)")
        with patch("app.routers.scene.scene_state.get_current_scene_index", side_effect=Exception("Database Exploded!")):
            res = client.get("/scene/current")
            print("Status:", res.status_code)
            print("Response:", res.json())
            
        print("\n[5] Testing Schema Cleaners (ISO Timestamps & Booleans)")
        res = client.get("/tasks/TSK001")
        print("Status:", res.status_code)
        data = res.json()
        print("Scheduled Start:", data.get("scheduled_start"))

if __name__ == "__main__":
    run_tests()
