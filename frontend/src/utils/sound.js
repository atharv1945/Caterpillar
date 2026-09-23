// Minimal Web Audio beeps — no external files to go missing mid-demo.
// Every call is wrapped so a blocked/unsupported AudioContext never throws;
// captions always carry the story even with zero audio.

let ctx;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function beep({ frequency, duration, type = "sine", volume = 0.15, delay = 0 }) {
  try {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch {
    // audio is a nice-to-have, never block the demo on it
  }
}

export function playListeningChime() {
  beep({ frequency: 880, duration: 0.16 });
  beep({ frequency: 1175, duration: 0.2, delay: 0.13 });
}

export function playCriticalAlert() {
  beep({ frequency: 640, duration: 0.15, type: "square", volume: 0.18 });
  beep({ frequency: 640, duration: 0.15, type: "square", volume: 0.18, delay: 0.22 });
}
