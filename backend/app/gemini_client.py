import os
import concurrent.futures
from google import genai
from app.config import GEMINI_API_KEY

class GeminiUnavailable(Exception):
    pass

def _do_call(prompt: str) -> str:
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    return response.text

def call_gemini(prompt: str, timeout_seconds: float = 5.0) -> str:
    if not GEMINI_API_KEY:
        raise GeminiUnavailable("GEMINI_API_KEY is not set.")
        
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_do_call, prompt)
            return future.result(timeout=timeout_seconds)
    except Exception as e:
        raise GeminiUnavailable(f"Gemini call failed: {str(e)}")
