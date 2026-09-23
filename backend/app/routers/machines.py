from fastapi import APIRouter, HTTPException, Request
from app.schemas import MachineOut

router = APIRouter()

@router.get("/{machine_id}", response_model=MachineOut)
def get_machine(machine_id: str, request: Request):
    df = request.app.state.data.get("machines")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Machines data not found")
        
    m_df = df[df['machine_id'] == machine_id]
    if m_df.empty:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")
        
    return m_df.iloc[0].to_dict()
