import { and, eq, gte, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";
import { db } from "../client";
import { budgets, transactions } from "../schema";

export type BudgetRow = typeof budgets.$inferSelect;

export function currentBudgetMonthKey(): number {
  const d = new Date();
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

/** YYYYMM → start/end of that calendar month (local). */
export function monthKeyToRange(monthKey: number): { startMs: number; endMs: number } {
  const y = Math.floor(monthKey / 100);
  const m = monthKey % 100;
  const startMs = new Date(y, m - 1, 1).getTime();
  const endMs = new Date(y, m, 0, 23, 59, 59, 999).getTime();
  return { startMs, endMs };
}

export function addMonthsToMonthKey(monthKey: number, delta: number): number {
  const y = Math.floor(monthKey / 100);
  const m = monthKey % 100;
  const d = new Date(y, m - 1 + delta, 1);
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

/** Next 12 month keys starting at `startKey` (inclusive). */
export function nextTwelveMonthKeysFrom(startKey: number): number[] {
  return Array.from({ length: 12 }, (_, i) => addMonthsToMonthKey(startKey, i));
}

export function fetchActiveBudgetsForMonth(monthKey: number): BudgetRow[] {
  return db.select().from(budgets).where(eq(budgets.month, monthKey)).all();
}

export function fetchBudgetById(id: string): BudgetRow | undefined {
  return db.select().from(budgets).where(eq(budgets.id, id)).get();
}

export function findBudgetByCategoryAndMonth(categoryId: string, monthKey: number): BudgetRow | undefined {
  return db
    .select()
    .from(budgets)
    .where(and(eq(budgets.categoryId, categoryId), eq(budgets.month, monthKey)))
    .get();
}

export function deleteBudgetById(id: string): void {
  db.delete(budgets).where(eq(budgets.id, id)).run();
}

export function updateBudgetLimits(id: string, monthlyLimit: number, alertThresholdPct: number): void {
  db.update(budgets).set({ monthlyLimit, alertThresholdPct }).where(eq(budgets.id, id)).run();
}

/**
 * Create a budget for category+month, or update limits when `editingId` matches that row.
 * Fails if another budget already uses the same category+month.
 */
export function setBudgetForCategoryMonth(
  categoryId: string,
  monthKey: number,
  monthlyLimit: number,
  alertThresholdPct: number,
  editingId: string | null,
): { ok: true } | { ok: false; reason: "duplicate" } {
  const existing = findBudgetByCategoryAndMonth(categoryId, monthKey);
  if (existing) {
    if (editingId && existing.id === editingId) {
      updateBudgetLimits(editingId, monthlyLimit, alertThresholdPct);
      return { ok: true };
    }
    return { ok: false, reason: "duplicate" };
  }
  if (editingId) {
    updateBudgetLimits(editingId, monthlyLimit, alertThresholdPct);
    return { ok: true };
  }
  db.insert(budgets)
    .values({
      id: nanoid(),
      categoryId,
      monthlyLimit,
      month: monthKey,
      alertThresholdPct,
    })
    .run();
  return { ok: true };
}

/** Insert or update by unique (category_id, month). */
export function upsertBudgetRow(row: {
  id: string;
  categoryId: string;
  month: number;
  monthlyLimit: number;
  alertThresholdPct: number;
}): void {
  db.insert(budgets)
    .values(row)
    .onConflictDoUpdate({
      target: [budgets.categoryId, budgets.month],
      set: {
        monthlyLimit: sql`excluded.monthly_limit`,
        alertThresholdPct: sql`excluded.alert_threshold_pct`,
      },
    })
    .run();
}

export function applyBudgetsForManyMonths(
  categoryId: string,
  startMonthKey: number,
  monthlyLimit: number,
  alertThresholdPct: number,
): { ok: true } {
  const keys = nextTwelveMonthKeysFrom(startMonthKey);
  db.transaction((tx) => {
    for (const mk of keys) {
      tx.insert(budgets)
        .values({
          id: nanoid(),
          categoryId,
          monthlyLimit,
          month: mk,
          alertThresholdPct,
        })
        .onConflictDoUpdate({
          target: [budgets.categoryId, budgets.month],
          set: {
            monthlyLimit: sql`excluded.monthly_limit`,
            alertThresholdPct: sql`excluded.alert_threshold_pct`,
          },
        })
        .run();
    }
  });
  return { ok: true };
}

export function sumExpenseInCategoryForRange(
  categoryId: string,
  startMs: number,
  endMs: number,
): number {
  const row = db
    .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.categoryId, categoryId),
        eq(transactions.type, "expense"),
        eq(transactions.isDeleted, false),
        gte(transactions.date, startMs),
        lte(transactions.date, endMs),
      ),
    )
    .get();
  return Number(row?.total ?? 0);
}
