/**
 * Production error tracking stub — swap for Sentry.init when DSN is configured.
 */
export function initErrorTracking(): void {
  if (__DEV__) return;
  console.log("[ErrorTracking] Production error tracking initialized");
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error("[Error]", error, context);
    return;
  }
  console.log("[ErrorTracking]", error.message, context);
}
