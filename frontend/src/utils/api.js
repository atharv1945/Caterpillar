// Thin fetch wrapper for the FastAPI backend. Every call has a short timeout
// and never throws past this module — callers get `null` on any failure
// (bad status, network error, timeout) and are expected to run that through
// getValueOrFallback so a flaky/offline backend never blanks the UI.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 2000;

async function apiGet(path, { params, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const url = new URL(path, BASE_URL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
      });
    }
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function apiPost(path, body, { timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const url = new URL(path, BASE_URL);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Bypasses /scene/current, /scene/advance, /scene/reset entirely — those run
// the backend's own frozen, server-side autonomous clock (a second,
// incompatible orchestrator). We call the underlying granular endpoints
// instead, keyed to the frontend's own elapsed-driven triggers.
export const api = {
  getEta: (taskId) => apiGet(`/tasks/${taskId}/eta`),
  getBehaviorInsight: (taskId) => apiGet(`/tasks/${taskId}/behavior_insight`),
  getActiveIdleEvent: (taskId) => apiGet(`/idle_events/active`, { params: { task_id: taskId } }),
  checkSafety: (taskId) => apiGet(`/safety/check`, { params: { task_id: taskId } }),
  getResumeBriefing: (taskId) => apiGet(`/tasks/${taskId}/resume`),
  postIdleReason: (idleEventId, reasonCode) => apiPost(`/idle_events/${idleEventId}/reason`, { reason_code: reasonCode }),
  logIncident: (eventId, note) => apiPost(`/safety/events/${eventId}/log_incident`, { note }),
  // 20 s timeout: Gemini round-trips can take several seconds; the backend times out at 15s.
  voiceQA: (question, language, context) =>
    apiPost(`/voice/qa`, { question, language, context: context ?? null }, { timeout: 20_000 }),
};
