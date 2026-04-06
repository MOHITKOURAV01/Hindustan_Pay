import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  type: text("type").notNull(),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  categoryId: text("category_id"),
  paymentMode: text("payment_mode"),
  title: text("title"),
  notes: text("notes"),
  date: integer("date", { mode: "number" }).notNull(),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  currency: text("currency").notNull().default("INR"),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  isStarred: integer("is_starred", { mode: "boolean" }).notNull().default(false),
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  recurrenceRule: text("recurrence_rule"),
  recurrenceEndDate: integer("recurrence_end_date", { mode: "number" }),
  parentTransactionId: text("parent_transaction_id"),
});

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  categoryId: text("category_id"),
  deadline: integer("deadline", { mode: "number" }),
  emoji: text("emoji"),
  color: text("color"),
  streakCount: integer("streak_count", { mode: "number" }).notNull().default(0),
  isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const budgets = sqliteTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull(),
    monthlyLimit: real("monthly_limit").notNull(),
    month: integer("month", { mode: "number" }).notNull(),
    alertThresholdPct: integer("alert_threshold_pct", { mode: "number" }).notNull().default(80),
  },
  (t) => [uniqueIndex("uq_budgets_category_month").on(t.categoryId, t.month)],
);

export const streakEntries = sqliteTable("streak_entries", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  date: integer("date", { mode: "number" }).notNull(),
  status: text("status").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const emi = sqliteTable("emi", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bank: text("bank").notNull(),
  totalAmount: real("total_amount").notNull(),
  emiAmount: real("emi_amount").notNull(),
  interestRate: real("interest_rate").notNull(),
  tenureMonths: integer("tenure_months", { mode: "number" }).notNull(),
  startDate: integer("start_date", { mode: "number" }).notNull(),
  nextDueDate: integer("next_due_date", { mode: "number" }).notNull(),
  remainingMonths: integer("remaining_months", { mode: "number" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const goalsRelations = relations(goals, ({ many }) => ({
  streakEntries: many(streakEntries),
}));

export const streakEntriesRelations = relations(streakEntries, ({ one }) => ({
  goal: one(goals, {
    fields: [streakEntries.goalId],
    references: [goals.id],
  }),
}));
