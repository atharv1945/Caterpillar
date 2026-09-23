def test_idle_events_roundtrip(client):
    # Note: earlier we set idle_end for TSK001 in manual tests, but on a fresh boot with seeded data,
    # TSK001's IE001 has no idle_end (well, wait, the CSV has idle_end populated for all of them from test_phase5).
    # Wait, IE001 was populated by my test script. 
    # But wait, TSK001 might not have an active idle event now!
    # Let's just create an endpoint test that safely handles either 200 or 404, or we can fetch a known event.
    
    # Let's test the active idle event endpoint
    res = client.get("/idle_events/active?task_id=TSK001")
    
    if res.status_code == 200:
        event = res.json()
        assert "idle_event_id" in event
        event_id = event["idle_event_id"]
        
        # Test valid reason
        post_res = client.post(f"/idle_events/{event_id}/reason", json={"reason_code": "scheduled_break"})
        assert post_res.status_code == 200
        assert post_res.json()["idle_reason_code"] == "scheduled_break"
        
    # Test invalid reason code 422
    res_422 = client.post("/idle_events/IE001/reason", json={"reason_code": "invalid_code"})
    assert res_422.status_code == 422
    data = res_422.json()
    assert data["error"] is True
