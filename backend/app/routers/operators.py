from fastapi import APIRouter, HTTPException, Request
from app.schemas import OperatorOut

router = APIRouter()

@router.get("/{operator_id}", response_model=OperatorOut)
def get_operator(operator_id: str, request: Request):
    df = request.app.state.data.get("operators")
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Operators data not found")
        
    op_df = df[df['operator_id'] == operator_id]
    if op_df.empty:
        raise HTTPException(status_code=404, detail=f"Operator {operator_id} not found")
        
    return op_df.iloc[0].to_dict()
