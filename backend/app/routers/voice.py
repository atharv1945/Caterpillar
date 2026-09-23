from fastapi import APIRouter
from app.schemas import VoiceQAIn, VoiceQAOut
from app import gemini_client
from app.fallback_phrases import get_fallback_phrase

router = APIRouter()

@router.post("/qa", response_model=VoiceQAOut)
def voice_qa(req: VoiceQAIn):
    context_str = f"\nContext: {req.context}" if req.context else ""
    prompt = f"You are a helpful AI companion for a heavy machinery operator. Answer their question briefly in {req.language}. Question: {req.question}{context_str}"
    
    try:
        answer = gemini_client.call_gemini(prompt)
        return {"answer": answer.strip(), "source": "gemini"}
    except gemini_client.GeminiUnavailable:
        fallback = get_fallback_phrase("call_officer", req.language)
        return {"answer": fallback, "source": "fallback"}
