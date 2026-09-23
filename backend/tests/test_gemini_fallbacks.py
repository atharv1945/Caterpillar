import pytest
from unittest.mock import patch
from app.gemini_client import GeminiUnavailable

@pytest.fixture
def chaos_gemini():
    # Monkeypatch the call_gemini function to ALWAYS raise GeminiUnavailable
    with patch("app.gemini_client.call_gemini", side_effect=GeminiUnavailable("CHAOS_MODE_ACTIVE")):
        yield

def test_translate_fallback(client, chaos_gemini):
    res = client.post("/translate", json={"text": "Hello", "target_language": "hi", "phrase_key": "greeting"})
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "fallback"
    assert len(data["translated_text"]) > 0

def test_voice_qa_fallback(client, chaos_gemini):
    res = client.post("/voice/qa", json={"question": "Help me!", "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "fallback"
    assert len(data["answer"]) > 0

def test_safety_summary_fallback(client, chaos_gemini):
    res = client.post("/safety/events/SE001/summarize")
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "fallback"
    assert len(data["summary"]) > 0
    assert "seatbelt_unfastened" in data["summary"]
