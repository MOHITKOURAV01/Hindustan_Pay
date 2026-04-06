import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  startOfDay,
} from "date-fns";
import { nanoid } from "nanoid/non-secure";
import type { RecurrenceRule, Transaction } from "@/types/transaction";
import {
  fetchActiveWithRecurrenceRule,
  insertTransaction,
  recurringSeriesRootId,
} from "@/db/queries/transactions";

function nextOccurrence(fromMs: number, rule: RecurrenceRule): number {
  const d = new Date(fromMs);
  switch (rule) {
    case "daily":
      return addDays(d, 1).getTime();
    case "weekly":
      return addWeeks(d, 1).getTime();
    case "monthly":
      return addMonths(d, 1).getTime();
    case "yearly":
      return addYears(d, 1).getTime();
    default:
      return fromMs;
  }
}

function sameDay(a: number, b: number): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function groupBySeries(list: Transaction[]): Map<string, Transaction[]> {
  const m = new Map<string, Transaction[]>();
  for (const t of list) {
    const key = recurringSeriesRootId(t);
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(t);
  }
  return m;
}

/**
 * Expands recurring templates into new rows when due. Returns number of rows inserted.
 */
export function processRecurringTransactions(): number {
  const all = fetchActiveWithRecurrenceRule();
  if (all.length === 0) return 0;

  const groups = groupBySeries(all);
  const todayLimit = endOfDay(new Date()).getTime();
  let created = 0;

  for (const [, rows] of groups) {
    const sorted = [...rows].sort((a, b) => b.date - a.date);
    let latest = sorted[0];
    const rootId = recurringSeriesRootId(latest);
    const rule = latest.recurrenceRule;
    if (!rule || !["daily", "weekly", "monthly", "yearly"].includes(rule)) continue;

    const endMs = latest.recurrenceEndDate;

    for (let guard = 0; guard < 400; guard++) {
      const nextMs = nextOccurrence(latest.date, rule);
      if (nextMs > todayLimit) break;
      if (endMs != null && nextMs > endMs) break;
      if (rows.some((r) => sameDay(r.date, nextMs))) break;

      const now = Date.now();
      const newRow: Transaction = {
        id: nanoid(),
        amount: latest.amount,
        type: latest.type,
        categoryId: latest.categoryId,
        title: latest.title,
        notes: latest.notes,
        date: nextMs,
        createdAt: now,
        updatedAt: now,
        isRecurring: true,
        currency: latest.currency,
        isDeleted: false,
        isStarred: false,
        isArchived: false,
        recurrenceRule: rule,
        recurrenceEndDate: endMs,
        parentTransactionId: rootId,
      };
      insertTransaction(newRow);
      created++;
      latest = newRow;
      rows.push(newRow);
    }
  }

  return created;
}
