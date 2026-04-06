import { and, desc, eq, isNotNull, or } from "drizzle-orm";
import { db } from "../client";
import { transactions } from "../schema";
import type { FilterState, Transaction } from "@/types/transaction";

function mapRow(r: typeof transactions.$inferSelect): Transaction {
  const rule = r.recurrenceRule as Transaction["recurrenceRule"];
  return {
    id: r.id,
    amount: r.amount,
    type: r.type as Transaction["type"],
    categoryId: r.categoryId,
    paymentMode: r.paymentMode as Transaction["paymentMode"],
    title: r.title,
    notes: r.notes,
    date: r.date,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    isRecurring: r.isRecurring,
    currency: r.currency,
    isDeleted: r.isDeleted,
    isStarred: r.isStarred,
    isArchived: r.isArchived,
    recurrenceRule: rule && ["daily", "weekly", "monthly", "yearly"].includes(rule) ? rule : null,
    recurrenceEndDate: r.recurrenceEndDate ?? null,
    parentTransactionId: r.parentTransactionId ?? null,
  };
}

export function fetchTransactions(): Transaction[] {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.isDeleted, false))
    .orderBy(desc(transactions.date))
    .all()
    .map(mapRow);
}

export function fetchTransactionById(id: string): Transaction | undefined {
  const row = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.isDeleted, false)))
    .get();
  return row ? mapRow(row) : undefined;
}

export function applyFilters(list: Transaction[], f: FilterState): Transaction[] {
  let out = list.filter((t) => !t.isArchived);
  const now = Date.now();
  if (f.datePreset === "week") {
    const start = now - 7 * 24 * 60 * 60 * 1000;
    out = out.filter((t) => t.date >= start);
  } else if (f.datePreset === "month") {
    const d = new Date(now);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    out = out.filter((t) => t.date >= start);
  } else if (f.datePreset === "lastMonth") {
    const d = new Date(now);
    const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).getTime();
    out = out.filter((t) => t.date >= start && t.date <= end);
  } else if (f.datePreset === "custom") {
    const from = f.dateFrom;
    const to = f.dateTo;
    if (from != null && to != null) {
      out = out.filter((t) => t.date >= from && t.date <= to);
    }
  }
  if (f.type !== "all") {
    out = out.filter((t) => t.type === f.type);
  }
  if (f.categoryIds.length) {
    out = out.filter((t) => t.categoryId && f.categoryIds.includes(t.categoryId));
  }
  if (f.amountMin != null) {
    out = out.filter((t) => t.amount >= f.amountMin!);
  }
  if (f.amountMax != null) {
    out = out.filter((t) => t.amount <= f.amountMax!);
  }
  if (f.sort === "newest") {
    out = [...out].sort((a, b) => b.date - a.date);
  } else if (f.sort === "oldest") {
    out = [...out].sort((a, b) => a.date - b.date);
  } else if (f.sort === "amountHigh") {
    out = [...out].sort((a, b) => b.amount - a.amount);
  } else {
    out = [...out].sort((a, b) => a.amount - b.amount);
  }
  return out;
}

export function insertTransaction(t: Omit<Transaction, "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number }) {
  const now = Date.now();
  db.insert(transactions)
    .values({
      id: t.id,
      amount: t.amount,
      type: t.type,
      categoryId: t.categoryId,
      paymentMode: t.paymentMode ?? null,
      title: t.title,
      notes: t.notes,
      date: t.date,
      createdAt: t.createdAt ?? now,
      updatedAt: t.updatedAt ?? now,
      isRecurring: t.isRecurring,
      currency: t.currency,
      isDeleted: t.isDeleted,
      isStarred: t.isStarred,
      isArchived: t.isArchived,
      recurrenceRule: t.recurrenceRule,
      recurrenceEndDate: t.recurrenceEndDate,
      parentTransactionId: t.parentTransactionId,
    })
    .run();
}

export function updateTransaction(id: string, patch: Partial<Transaction>) {
  const next: Record<string, unknown> = { updatedAt: Date.now() };
  (
    [
      "amount",
      "type",
      "categoryId",
      "paymentMode",
      "title",
      "notes",
      "date",
      "isRecurring",
      "currency",
      "isStarred",
      "isArchived",
      "isDeleted",
      "recurrenceRule",
      "recurrenceEndDate",
      "parentTransactionId",
    ] as const
  ).forEach((k) => {
    if (k in patch && patch[k] !== undefined) next[k] = patch[k];
  });
  db.update(transactions)
    .set(next as typeof transactions.$inferInsert)
    .where(eq(transactions.id, id))
    .run();
}

export function softDeleteTransaction(id: string) {
  db.update(transactions)
    .set({ isDeleted: true, updatedAt: Date.now() })
    .where(eq(transactions.id, id))
    .run();
}

export function softDeleteTransactions(ids: string[]) {
  if (ids.length === 0) return;
  const now = Date.now();
  db.transaction((tx) => {
    for (const id of ids) {
      tx
        .update(transactions)
        .set({ isDeleted: true, updatedAt: now })
        .where(eq(transactions.id, id))
        .run();
    }
  });
}

/** Root id = transaction that started the series (parent is null). */
export function recurringSeriesRootId(t: Transaction): string {
  return t.parentTransactionId ?? t.id;
}

export function softDeleteRecurringSeries(rootId: string) {
  db.update(transactions)
    .set({ isDeleted: true, updatedAt: Date.now() })
    .where(or(eq(transactions.id, rootId), eq(transactions.parentTransactionId, rootId)))
    .run();
}

export function fetchActiveWithRecurrenceRule(): Transaction[] {
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.isDeleted, false), isNotNull(transactions.recurrenceRule)))
    .all()
    .map(mapRow);
}

export function toggleStarTransaction(id: string, starred: boolean) {
  db.update(transactions)
    .set({ isStarred: starred, updatedAt: Date.now() })
    .where(eq(transactions.id, id))
    .run();
}

export function toggleArchiveTransaction(id: string, archived: boolean) {
  db.update(transactions)
    .set({ isArchived: archived, updatedAt: Date.now() })
    .where(eq(transactions.id, id))
    .run();
}
