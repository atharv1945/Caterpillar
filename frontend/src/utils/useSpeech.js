// useSpeech — browser Speech Recognition (STT) + Speech Synthesis (TTS).
// Both are progressively enhanced: the app works fine on browsers/contexts
// where either API is absent; callers receive null from useSpeech and should
// fall back gracefully (e.g., show a text-input field instead).
//
// Language codes: "en" → "en-US", "hi" → "hi-IN", "ta" → "ta-IN".
// These are the exact BCP-47 tags the Web Speech API understands and that
// Gemini's TTS voices support.

import { useCallback, useEffect, useRef, useState } from "react";

const LANG_BCP47 = {
  en: "en-US",
  hi: "hi-IN",
  ta: "ta-IN",
};

function toBCP47(lang) {
  return LANG_BCP47[lang] ?? "en-US";
}

// Pick the best available voice for the given BCP-47 locale.
// Falls back to any voice containing the language prefix, then to the
// browser default. Called lazily so voices are loaded before first use.
function pickVoice(bcp47) {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (!voices.length) return null;
  const exact = voices.find((v) => v.lang === bcp47);
  if (exact) return exact;
  const prefix = bcp47.split("-")[0];
  return voices.find((v) => v.lang.startsWith(prefix)) ?? null;
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useSpeech({ language = "en" } = {}) {
  const bcp47 = toBCP47(language);

  // STT availability
  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
      : null;
  const sttSupported = Boolean(SpeechRecognition);

  // TTS availability
  const ttsSupported =
    typeof window !== "undefined" && Boolean(window.speechSynthesis);

  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sttError, setSttError] = useState(null);

  // Ensure recognition instance uses the current language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = bcp47;
    }
  }, [bcp47]);

  const startListening = useCallback(
    ({ onResult, onEnd } = {}) => {
      if (!SpeechRecognition) return;

      // Cancel any existing session before creating a new one
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }

      const rec = new SpeechRecognition();
      rec.lang = bcp47;
      rec.interimResults = true;  // keeps session alive during speech
      rec.maxAlternatives = 1;
      // continuous: true prevents Chrome from auto-closing the session
      // after a short silence — we stop manually once we have a final result.
      rec.continuous = true;

      rec.onstart = () => {
        console.log("STT: onstart fired");
        setListening(true);
        setSttError(null);
        setTranscript("");
      };

      rec.onresult = (event) => {
        console.log("STT: onresult fired", event);
        // Walk results looking for the first final transcript
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0]?.transcript ?? "";
            if (text.trim()) {
              setTranscript(text);
              // Stop listening — caller gets one clean utterance
              try { rec.stop(); } catch { /* ignore */ }
              onResult?.(text);
              return;
            }
          }
        }
      };

      rec.onerror = (event) => {
        console.error("STT: onerror fired:", event.error, event.message);
        // 'no-speech' is not a hard error — just ignore it, keep listening
        if (event.error === 'no-speech') return;
        setSttError(event.error);
        setListening(false);
        onEnd?.(event.error);
      };

      rec.onend = () => {
        console.log("STT: onend fired");
        setListening(false);
        onEnd?.();
      };

      recognitionRef.current = rec;
      try {
        console.log("STT: calling rec.start()...");
        rec.start();
      } catch (err) {
        console.error("STT: rec.start() threw an error:", err);
        setSttError(err.message);
        setListening(false);
      }
    },
    [SpeechRecognition, bcp47]
  );

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  // ── TTS ─────────────────────────────────────────────────────────────────
  const speak = useCallback(
    (text, { rate = 1, pitch = 1 } = {}) => {
      if (!ttsSupported || !text) return;
      // Cancel any current speech before speaking new text
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = bcp47;
      utter.rate = rate;
      utter.pitch = pitch;

      // Voice selection — wait for voices to load if needed
      const trySpeak = () => {
        const voice = pickVoice(bcp47);
        if (voice) utter.voice = voice;
        window.speechSynthesis.speak(utter);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        trySpeak();
      } else {
        window.speechSynthesis.addEventListener("voiceschanged", trySpeak, { once: true });
      }
    },
    [bcp47, ttsSupported]
  );

  const cancelSpeech = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel();
  }, [ttsSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      if (ttsSupported) window.speechSynthesis.cancel();
    };
  }, [ttsSupported]);

  return {
    sttSupported,
    ttsSupported,
    listening,
    transcript,
    sttError,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
    language,
    bcp47,
  };
}
