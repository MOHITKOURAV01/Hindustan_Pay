import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";
import { db } from "../client";
import { emi } from "../schema";
import type { EMI } from "@/types/emi";

function mapRow(r: typeof emi.$inferSelect): EMI {
  return {
    id: r.id,
    name: r.name,
    bank: r.bank,
    totalAmount: r.totalAmount,
    emiAmount: r.emiAmount,
    interestRate: r.interestRate,
    tenureMonths: r.tenureMonths,
    startDate: r.startDate,
    nextDueDate: r.nextDueDate,
    remainingMonths: r.remainingMonths,
    isActive: r.isActive ? 1 : 0,
    createdAt: r.createdAt,
  };
}

export async function getAllEMIs(): Promise<EMI[]> {
  const rows = db
    .select()
    .from(emi)
    .where(eq(emi.isActive, true))
    .orderBy(asc(emi.nextDueDate))
    .all();
  return rows.map(mapRow);
}

export async function insertEMI(row: Omit<EMI, "id" | "createdAt" | "isActive"> & { id?: string; createdAt?: number; isActive?: number }): Promise<string> {
  const now = Date.now();
  const id = row.id ?? nanoid();
  db.insert(emi)
    .values({
      id,
      name: row.name,
      bank: row.bank,
      totalAmount: row.totalAmount,
      emiAmount: row.emiAmount,
      interestRate: row.interestRate,
      tenureMonths: row.tenureMonths,
      startDate: row.startDate,
      nextDueDate: row.nextDueDate,
      remainingMonths: row.remainingMonths,
      isActive: (row.isActive ?? 1) === 1,
      createdAt: row.createdAt ?? now,
    })
    .run();
  return id;
}

export async function updateEMI(id: string, updates: Partial<EMI>): Promise<void> {
  const next: Record<string, unknown> = {};
  (
    [
      "name",
      "bank",
      "totalAmount",
      "emiAmount",
      "interestRate",
      "tenureMonths",
      "startDate",
      "nextDueDate",
      "remainingMonths",
      "createdAt",
      "isActive",
    ] as const
  ).forEach((k) => {
    if (k in updates && updates[k] !== undefined) next[k] = updates[k];
  });
  if ("isActive" in next) next.isActive = (updates.isActive ?? 1) === 1;
  db.update(emi).set(next as typeof emi.$inferInsert).where(eq(emi.id, id)).run();
}

export async function deleteEMI(id: string): Promise<void> {
  db.delete(emi).where(eq(emi.id, id)).run();
}

export async function fetchEMIById(id: string): Promise<EMI | null> {
  const row = db.select().from(emi).where(eq(emi.id, id)).get();
  return row ? mapRow(row) : null;
}

