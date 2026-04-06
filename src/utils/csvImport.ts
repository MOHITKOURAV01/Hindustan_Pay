import * as FileSystem from "expo-file-system/legacy";
import { nanoid } from "nanoid/non-secure";
import Papa from "papaparse";
import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { fetchAllCategories } from "@/db/queries/categories";
import type { TransactionType } from "@/types/transaction";

export type ImportResult = { success: number; failed: number; errors: string[] };

function normKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, "_");
}

function rowGet(row: Record<string, string>, ...names: string[]): string | undefined {
  const keys = Object.keys(row);
  const map = new Map(keys.map((k) => [normKey(k), row[k]]));
  for (const n of names) {
    const v = map.get(normKey(n));
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

function parseAmount(raw: string): number | null {
  const s = raw.replace(/[,\s₹$]/g, "").trim();
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function normalizeType(raw: string): TransactionType | null {
  const t = raw.trim().toLowerCase();
  if (t === "credit" || t === "income" || t === "inc") return "income";
  if (t === "debit" || t === "expense" || t === "exp") return "expense";
  return null;
}

function parseDateCell(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  if (/^\d{10,13}$/.test(s)) {
    const n = parseInt(s, 10);
    return s.length <= 10 ? n * 1000 : n;
  }
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return iso;
  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    if (a > 12) return new Date(y, b - 1, a).getTime();
    if (b > 12) return new Date(y, a - 1, b).getTime();
    return new Date(y, b - 1, a).getTime();
  }
  return null;
}

export async function importTransactionsFromCSV(uri: string): Promise<ImportResult> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  const csvString = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const parsed = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    for (const e of parsed.errors.slice(0, 20)) {
      errors.push(e.message ?? "Parse error");
    }
  }

  const categories = fetchAllCategories();
  const byName = new Map<string, string>();
  for (const c of categories) {
    byName.set(c.name.trim().toLowerCase(), c.id);
  }
  const otherId = byName.get("other") ?? "cat_other";

  const rows: Omit<typeof schema.transactions.$inferInsert, never>[] = [];
  const now = Date.now();

  let line = 1;
  for (const row of parsed.data) {
    line += 1;
    const amountRaw = rowGet(row, "amount", "amt", "value");
    const typeRaw = rowGet(row, "type", "kind", "direction");
    const catRaw = rowGet(row, "category", "cat");
    const titleRaw =
      rowGet(row, "title", "description", "name", "memo", "payee") ?? "";
    const dateRaw = rowGet(row, "date", "txn_date", "transaction_date");
    const notesRaw = rowGet(row, "notes", "note", "comment", "remarks") ?? null;

    if (!amountRaw || !typeRaw || !dateRaw) {
      failed += 1;
      errors.push(`Row ${line}: missing amount, type, or date`);
      continue;
    }

    const amount = parseAmount(amountRaw);
    const type = normalizeType(typeRaw);
    const dateMs = parseDateCell(dateRaw);

    if (amount == null) {
      failed += 1;
      errors.push(`Row ${line}: invalid amount`);
      continue;
    }
    if (!type) {
      failed += 1;
      errors.push(`Row ${line}: type must be income or expense`);
      continue;
    }
    if (dateMs == null) {
      failed += 1;
      errors.push(`Row ${line}: invalid date`);
      continue;
    }

    let categoryId: string | null = null;
    if (catRaw) {
      const id = byName.get(catRaw.trim().toLowerCase());
      categoryId = id ?? otherId;
    } else {
      categoryId = otherId;
    }

    rows.push({
      id: nanoid(),
      amount,
      type,
      categoryId,
      title: titleRaw || null,
      notes: notesRaw,
      date: dateMs,
      createdAt: now,
      updatedAt: now,
      isRecurring: false,
      currency: "INR",
      isDeleted: false,
      isStarred: false,
      isArchived: false,
      recurrenceRule: null,
      recurrenceEndDate: null,
      parentTransactionId: null,
    });
  }

  if (rows.length === 0) {
    return { success: 0, failed, errors };
  }

  try {
    db.transaction((tx) => {
      for (const v of rows) {
        tx.insert(schema.transactions).values(v).run();
      }
    });
    success = rows.length;
  } catch (e) {
    failed += rows.length;
    errors.push(e instanceof Error ? e.message : "Database transaction failed");
  }

  return { success, failed, errors: errors.slice(0, 50) };
}
