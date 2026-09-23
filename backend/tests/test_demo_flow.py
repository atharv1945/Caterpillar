import pytest

def run_single_demo_flow(client):
    # 1. Reset
    reset_res = client.post("/scene/reset")
    assert reset_res.status_code == 200
    
    # Track progression
    expected_scenes = [
        "morning_greeting",
        "dashboard",
        "task_start_eta",
        "idle_moment",
        "condition_change_eta_recalc",
        "safety_event",
        "task_complete_behavior_insight",
        "training_recommendation",
        "handover_resume"
    ]
    
    # 2. Advance through all scenes
    for i, expected_scene in enumerate(expected_scenes):
        if i == 0:
            res = client.get("/scene/current")
        else:
            res = client.post("/scene/advance")
            
        assert res.status_code == 200
        data = res.json()
        assert data["scene_name"] == expected_scene
        assert data["scene_index"] == i
        
        payload = data["payload"]
        if expected_scene == "task_start_eta":
            assert "eta" in payload
        elif expected_scene == "dashboard":
            assert "task_buckets" in payload

@pytest.mark.parametrize("run_num", [1, 2, 3])
def test_demo_flow_repeatability(client, run_num):
    # This runs the full flow 3 times due to parametrize,
    # assuring determinism and identical ordering on every pass.
    run_single_demo_flow(client)
