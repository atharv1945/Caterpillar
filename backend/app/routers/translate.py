from fastapi import APIRouter
from app.schemas import TranslateIn, TranslateOut
from app import gemini_client
from app.fallback_phrases import get_fallback_phrase

router = APIRouter()

@router.post("", response_model=TranslateOut)
def translate_text(req: TranslateIn):
    prompt = f"Translate the following text into {req.target_language}. Return ONLY the translation, nothing else.\nText: {req.text}"
    try:
        translated = gemini_client.call_gemini(prompt)
        return {"translated_text": translated.strip(), "source": "gemini"}
    except gemini_client.GeminiUnavailable:
        if req.phrase_key:
            fallback = get_fallback_phrase(req.phrase_key, req.target_language)
            return {"translated_text": fallback, "source": "fallback"}
        else:
            return {"translated_text": req.text + " (Translation unavailable)", "source": "fallback"}
