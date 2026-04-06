/**
 * Analytics Stub for Hindustan Pay.
 * Demonstrates event tracking, user properties, and session management.
 * In a real app, this would connect to Firebase, Mixpanel, or Amplitude.
 */

export type AnalyticsEvent = 
  | "transaction_added"
  | "goal_created"
  | "emi_tracked"
  | "theme_changed"
  | "language_changed"
  | "edition_changed"
  | "health_score_checked"
  | "export_data"
  | "app_open";

export const Analytics = {
  track: (event: AnalyticsEvent, properties?: Record<string, any>) => {
    console.log(`[Analytics] Event: ${event}`, properties);
    // TODO: Connect to Segment/Firebase/etc.
  },

  identify: (userId: string, traits?: Record<string, any>) => {
    console.log(`[Analytics] Identify User: ${userId}`, traits);
  },

  screen: (name: string, properties?: Record<string, any>) => {
    console.log(`[Analytics] Screen View: ${name}`, properties);
  },
};

/**
 * Performance Monitoring Stub.
 * Simple utility to measure execution time of expensive business logic.
 */
export const Perf = {
  start: (label: string) => {
    if (__DEV__) {
      console.time(`[PERF] ${label}`);
    }
  },
  stop: (label: string) => {
    if (__DEV__) {
      console.timeEnd(`[PERF] ${label}`);
    }
  },
};
