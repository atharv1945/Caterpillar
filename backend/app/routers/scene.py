from fastapi import APIRouter, Request
from app.schemas import SceneOut
from app import scene_state
import datetime

router = APIRouter()

@router.get("/current", response_model=SceneOut)
def get_current_scene(request: Request):
    index = scene_state.get_current_scene_index()
    scene = scene_state.SCENES[index]
    
    payload = scene_state.assemble_scene_payload(scene["name"], request.app.state)
    
    return {
        "scene_index": index,
        "scene_name": scene["name"],
        "total_scenes": len(scene_state.SCENES),
        "payload": payload
    }

@router.post("/advance", response_model=SceneOut)
def advance_scene(request: Request):
    current_index = scene_state.get_current_scene_index()
    
    # Calculate next index, capping at the max scenes available
    next_index = current_index + 1
    if next_index >= len(scene_state.SCENES):
        next_index = len(scene_state.SCENES) - 1
        
    scene_state.manual_override_index = next_index
    
    scene = scene_state.SCENES[next_index]
    payload = scene_state.assemble_scene_payload(scene["name"], request.app.state)
    
    return {
        "scene_index": next_index,
        "scene_name": scene["name"],
        "total_scenes": len(scene_state.SCENES),
        "payload": payload
    }

@router.post("/reset")
def reset_scene():
    scene_state.shift_start_time = datetime.datetime.now()
    scene_state.manual_override_index = None
    
    return {"status": "success", "message": "Demo scene state has been reset."}
