import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch

def run_tests():
    print("=== Testing with Fallbacks (Multilingual) ===")
    
    with TestClient(app) as client:
        for lang, lang_name in [("en", "English"), ("hi", "Hindi"), ("ta", "Tamil")]:
            print(f"\n--- Testing {lang_name} ({lang}) ---")
            
            # 1. /translate
            res = client.post("/translate", json={"text": "Hello", "target_language": lang, "phrase_key": "greeting"})
            print(f"POST /translate (fallback, {lang}):")
            print(res.json())
            
            # 2. /voice/qa
            res2 = client.post("/voice/qa", json={"question": "How do I start the engine?", "language": lang})
            print(f"POST /voice/qa (fallback, {lang}):")
            print(res2.json())
            
        # 3. /safety/events/{event_id}/summarize (language independent, but we test it)
        print("\n--- Testing Safety Summary ---")
        res3 = client.post("/safety/events/SE001/summarize")
        print("POST /safety/events/SE001/summarize (fallback):")
        print(res3.json())
    
        print("\n=== Testing with Mocked 'Real' Gemini ===")
        
        with patch("app.gemini_client.call_gemini") as mock_gemini:
            mock_gemini.return_value = "Mocked Gemini Response."
            
            # Just test English for the mocked success path to verify it still works
            lang = "en"
            
            # 1. /translate
            res = client.post("/translate", json={"text": "Hello", "target_language": lang, "phrase_key": "greeting"})
            print(f"POST /translate (gemini, {lang}):")
            print(res.json())
            
            # 2. /voice/qa
            res2 = client.post("/voice/qa", json={"question": "How do I start the engine?", "language": lang})
            print(f"POST /voice/qa (gemini, {lang}):")
            print(res2.json())
            
            # 3. /safety/events/{event_id}/summarize
            res3 = client.post("/safety/events/SE001/summarize")
            print("POST /safety/events/SE001/summarize (gemini):")
            print(res3.json())

if __name__ == "__main__":
    run_tests()
