from app.rules import check_seatbelt, check_proximity, evaluate_safety, SEVERITY_CRITICAL, SEVERITY_CLEAR

def test_seatbelt():
    # Clear
    res = check_seatbelt({"seatbelt_status": "fastened"})
    assert res["triggered"] == False
    assert res["severity"] == SEVERITY_CLEAR
    
    # Triggered
    res = check_seatbelt({"seatbelt_status": "unfastened"})
    assert res["triggered"] == True
    assert res["severity"] == SEVERITY_CRITICAL

def test_proximity():
    # Clear
    res = check_proximity({"proximity_alert": False})
    assert res["triggered"] == False
    assert res["severity"] == SEVERITY_CLEAR
    
    # Triggered
    res = check_proximity({"proximity_alert": True})
    assert res["triggered"] == True
    assert res["severity"] == SEVERITY_CRITICAL

def test_evaluate_safety():
    # Clear
    res = evaluate_safety({"seatbelt_status": "fastened", "proximity_alert": False})
    assert res["triggered"] == False
    assert res["severity"] == SEVERITY_CLEAR
    
    # Seatbelt only
    res = evaluate_safety({"seatbelt_status": "unfastened", "proximity_alert": False})
    assert res["triggered"] == True
    assert res["severity"] == SEVERITY_CRITICAL
    assert "Seatbelt" in res["message"]
    
    # Proximity only
    res = evaluate_safety({"seatbelt_status": "fastened", "proximity_alert": True})
    assert res["triggered"] == True
    assert res["severity"] == SEVERITY_CRITICAL
    assert "Proximity" in res["message"]
    
    # Both
    res = evaluate_safety({"seatbelt_status": "unfastened", "proximity_alert": True})
    assert res["triggered"] == True
    assert res["severity"] == SEVERITY_CRITICAL
    assert "Seatbelt" in res["message"] and "Proximity" in res["message"]

if __name__ == "__main__":
    test_seatbelt()
    test_proximity()
    test_evaluate_safety()
    print("All unit tests passed!")
