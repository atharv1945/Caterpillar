from app.rules import check_seatbelt, check_proximity, evaluate_safety

def test_check_seatbelt():
    assert check_seatbelt({"seatbelt_status": "unfastened"}) == {"triggered": True, "severity": "critical", "message": "Seatbelt is unfastened"}
    assert check_seatbelt({"seatbelt_status": "fastened"}) == {"triggered": False, "severity": "clear", "message": "Seatbelt fastened"}

def test_check_proximity():
    assert check_proximity({"proximity_alert": True}) == {"triggered": True, "severity": "critical", "message": "Proximity hazard detected"}
    assert check_proximity({"proximity_alert": False}) == {"triggered": False, "severity": "clear", "message": "No proximity hazards"}

def test_evaluate_safety():
    # Clear
    res = evaluate_safety({"seatbelt_status": "fastened", "proximity_alert": False})
    assert res["triggered"] is False
    assert res["severity"] == "clear"
    
    # Critical
    res = evaluate_safety({"seatbelt_status": "unfastened", "proximity_alert": True})
    assert res["triggered"] is True
    assert res["severity"] == "critical"
    
def test_safety_check_endpoint(client):
    # Test on golden TSK001
    res = client.get("/safety/check?task_id=TSK001")
    assert res.status_code == 200
    data = res.json()
    assert "triggered" in data
    assert "severity" in data
    assert data["task_id"] == "TSK001"
