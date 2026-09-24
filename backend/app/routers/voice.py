from fastapi import APIRouter
from app.schemas import VoiceQAIn, VoiceQAOut
from app import gemini_client
from app.fallback_phrases import get_fallback_phrase

router = APIRouter()

@router.post("/qa", response_model=VoiceQAOut)
def voice_qa(req: VoiceQAIn):
    context_str = f"\nContext: {req.context}" if req.context else ""
    if req.language == "hi":
        lang_instruction = "natural conversational Hinglish (Hindi mixed with common English construction terms, written in Devanagari script but using casual vocabulary like 'task', 'complete', 'status')"
    elif req.language == "ta":
        lang_instruction = "natural conversational Tanglish (Tamil mixed with common English construction terms, written in Tamil script but using casual vocabulary like 'task', 'complete', 'status')"
    else:
        lang_instruction = "English"

    prompt = f"You are a helpful AI companion for a heavy machinery operator. Answer their question briefly in {lang_instruction}. Question: {req.question}{context_str}"
    
    try:
        answer = gemini_client.call_gemini(prompt)
        return {"answer": answer.strip(), "source": "gemini"}
    except gemini_client.GeminiUnavailable:
        fallback = get_fallback_phrase("call_officer", req.language)
        return {"answer": fallback, "source": "fallback"}
