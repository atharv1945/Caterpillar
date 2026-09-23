// Safety net for every "this looks like it comes from a model" value in the
// demo (ETA minutes, behavior-insight text, …). If a teammate's real model/API
// output is missing, NaN, or outside a sane range, we silently fall back to a
// pre-checked hardcoded value instead of ever showing blank/undefined on stage.
export function getValueOrFallback(modelOutput, hardcodedFallback, { min, max } = {}) {
  if (modelOutput === null || modelOutput === undefined) return hardcodedFallback;

  if (typeof modelOutput === "number") {
    if (Number.isNaN(modelOutput) || !Number.isFinite(modelOutput)) return hardcodedFallback;
    if (min !== undefined && modelOutput < min) return hardcodedFallback;
    if (max !== undefined && modelOutput > max) return hardcodedFallback;
  }

  if (typeof modelOutput === "string" && modelOutput.trim() === "") return hardcodedFallback;

  return modelOutput;
}
