from app.routers.tasks import bucket_tasks
import pandas as pd

def test_bucket_tasks_pure():
    data = [
        {"task_id": "T1", "operator_id": "OP1", "status": "completed", "scheduled_start": "08:00"},
        {"task_id": "T2", "operator_id": "OP1", "status": "in_progress", "scheduled_start": "09:00"},
        {"task_id": "T3", "operator_id": "OP1", "status": "scheduled", "scheduled_start": "10:00"},
        {"task_id": "T4", "operator_id": "OP1", "status": "scheduled", "scheduled_start": "11:00"}
    ]
    df = pd.DataFrame(data)
    result = bucket_tasks(df, "OP1")
    
    assert result["now"]["task_id"] == "T2"
    assert result["next"]["task_id"] == "T3"
    assert len(result["later"]) == 1
    assert result["later"][0]["task_id"] == "T4"

def test_dashboard_endpoint(client):
    res = client.get("/tasks/dashboard?operator_id=OP1001")
    assert res.status_code == 200
    data = res.json()
    assert "now" in data
    assert "next" in data
    assert "later" in data
    # In seeded data, OP1001 has TSK001 completed, TSK002 in progress, TSK003 and TSK004 scheduled
    assert data["now"]["task_id"] == "TSK002"
    assert data["next"]["task_id"] == "TSK003"
    assert len(data["later"]) == 1  # TSK004
    assert isinstance(data["later"], list)
