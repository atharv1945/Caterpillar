def test_checkpoints_roundtrip(client):
    # Post a checkpoint
    checkpoint_data = {
        "progress_pct": 65.5,
        "cycles_completed": 25,
        "notes": "Testing integration",
        "event_type": "pause"
    }
    post_res = client.post("/tasks/TSK001/checkpoint", json=checkpoint_data)
    assert post_res.status_code == 200
    
    # Get resume briefing
    get_res = client.get("/tasks/TSK001/resume")
    assert get_res.status_code == 200
    data = get_res.json()
    
    assert data["progress_pct"] == 65.5
    assert data["cycles_completed"] == 25
    assert data["last_note"] == "Testing integration"
    
    assert "briefing_sentence" in data
    assert len(data["briefing_sentence"]) > 0
    assert "Testing integration" in data["briefing_sentence"]
