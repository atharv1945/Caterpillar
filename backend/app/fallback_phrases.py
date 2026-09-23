FALLBACK_PHRASES = {
    # Greeting
    ("greeting", "en"): "Good morning. Ready for today's tasks?",
    ("greeting", "hi"): "सुप्रभात। क्या आप आज के कार्यों के लिए तैयार हैं?",
    ("greeting", "ta"): "காலை வணக்கம். இன்றைய பணிகளுக்குத் தயாரா?",
    
    # Task/ETA updates
    ("eta_updated", "en"): "ETA updated based on current progress.",
    ("eta_updated", "hi"): "वर्तमान प्रगति के आधार पर ईटीए अपडेट किया गया।",
    ("eta_updated", "ta"): "தற்போதைய முன்னேற்றத்தின் அடிப்படையில் வருகை நேரம் புதுப்பிக்கப்பட்டது.",
    
    # Idle/"Why are you waiting?"
    ("idle_prompt", "en"): "You've been idle for a while. What's the reason?",
    ("idle_prompt", "hi"): "आप कुछ समय से निष्क्रिय हैं। कारण क्या है?",
    ("idle_prompt", "ta"): "நீங்கள் சிறிது நேரம் சும்மா இருக்கிறீர்கள். காரணம் என்ன?",
    
    # Safety warnings
    ("safety_warning", "en"): "Warning: Safety hazard detected. Please pause operation.",
    ("safety_warning", "hi"): "चेतावनी: सुरक्षा खतरा पाया गया। कृपया काम रोक दें।",
    ("safety_warning", "ta"): "எச்சரிக்கை: பாதுகாப்பு ஆபத்து கண்டறியப்பட்டது. தயவுசெய்து வேலையை நிறுத்தவும்.",
    
    # Incident summaries
    ("incident_summary", "en"): "An incident was logged regarding safety.",
    ("incident_summary", "hi"): "सुरक्षा से संबंधित एक घटना लॉग की गई थी।",
    ("incident_summary", "ta"): "பாதுகாப்பு குறித்து ஒரு சம்பவம் பதிவு செய்யப்பட்டது.",
    
    # Task completion
    ("task_completion", "en"): "Task completed successfully. Great job!",
    ("task_completion", "hi"): "कार्य सफलतापूर्वक पूरा हुआ। बहुत बढ़िया!",
    ("task_completion", "ta"): "பணி வெற்றிகரமாக முடிந்தது. மிக நன்று!",
    
    # Training instructions
    ("training_instruction", "en"): "Please review the following training module.",
    ("training_instruction", "hi"): "कृपया निम्नलिखित प्रशिक्षण मॉड्यूल की समीक्षा करें।",
    ("training_instruction", "ta"): "பின்வரும் பயிற்சித் தொகுதியை மதிப்பாய்வு செய்யவும்.",
    
    # Handover/resume
    ("handover_resume", "en"): "Resuming your previous task.",
    ("handover_resume", "hi"): "आपका पिछला कार्य फिर से शुरू किया जा रहा है।",
    ("handover_resume", "ta"): "உங்கள் முந்தைய பணியைத் தொடர்கிறது.",
    
    # Call Officer fallback
    ("call_officer", "en"): "I couldn't reach that right now — try the Call Officer button for help.",
    ("call_officer", "hi"): "मैं अभी वहां नहीं पहुंच सका — मदद के लिए कॉल ऑफिसर बटन आज़माएं।",
    ("call_officer", "ta"): "என்னால் இப்போது அதை அடைய முடியவில்லை - உதவிக்கு அழைப்பு அதிகாரி (Call Officer) பொத்தானை முயற்சிக்கவும்."
}

def get_fallback_phrase(phrase_key: str, language: str) -> str:
    # Default to en if language not found
    return FALLBACK_PHRASES.get((phrase_key, language), FALLBACK_PHRASES.get((phrase_key, "en"), "Information unavailable."))
