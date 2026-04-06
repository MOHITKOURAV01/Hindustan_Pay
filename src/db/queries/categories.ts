import { asc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { categories, transactions } from "../schema";

export type CategoryRow = typeof categories.$inferSelect;

export function fetchAllCategories(): CategoryRow[] {
  return db.select().from(categories).orderBy(asc(categories.name)).all();
}

export function countTransactionsUsingCategory(categoryId: string): number {
  const row = db
    .select({ n: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.categoryId, categoryId))
    .get();
  return Number(row?.n ?? 0);
}

export function insertCategory(row: {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  isCustom: boolean;
}) {
  db.insert(categories)
    .values({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      isCustom: row.isCustom,
    })
    .run();
}

export function updateCategoryRow(
  id: string,
  patch: Partial<Pick<CategoryRow, "name" | "icon" | "color" | "type">>,
) {
  db.update(categories).set(patch).where(eq(categories.id, id)).run();
}

export function deleteCategoryRow(id: string) {
  db.delete(categories).where(eq(categories.id, id)).run();
}

export function reassignTransactionsCategory(fromCategoryId: string, toCategoryId: string) {
  db.update(transactions)
    .set({ categoryId: toCategoryId, updatedAt: Date.now() })
    .where(eq(transactions.categoryId, fromCategoryId))
    .run();
}
