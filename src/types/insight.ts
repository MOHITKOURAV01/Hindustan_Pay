export type InsightKind =
  | "TOP_CATEGORY"
  | "WEEK_COMPARISON"
  | "BEST_DAY"
  | "PEAK_TIME"
  | "STREAK_STATUS"
  | "SAVINGS_RATE"
  | "RECURRING_DETECTOR"
  | "LARGEST_TRANSACTION"
  | "CATEGORY_SPIKE"
  | "MONTHLY_TREND"
  | "SAVINGS_SUGGESTION";

export type Insight = {
  id: string;
  type: InsightKind;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  value?: number;
  tone: "info" | "warning" | "success";
  dismissible: boolean;
};
