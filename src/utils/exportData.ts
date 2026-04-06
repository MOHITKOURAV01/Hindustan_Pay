import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import type { Transaction } from "@/types/transaction";
import { fetchAllCategories } from "@/db/queries/categories";

function catName(id: string | null) {
  if (!id) return "";
  return fetchAllCategories().find((c) => c.id === id)?.name ?? id;
}

export async function exportTransactionsCsv(rows: Transaction[]): Promise<void> {
  const header =
    "id,amount,type,category,title,notes,date,created_at,currency,is_deleted\n";
  const body = rows
    .map((t) =>
      [
        t.id,
        t.amount,
        t.type,
        catName(t.categoryId),
        JSON.stringify(t.title ?? ""),
        JSON.stringify(t.notes ?? ""),
        t.date,
        t.createdAt,
        t.currency,
        t.isDeleted,
      ].join(","),
    )
    .join("\n");
  const path = `${FileSystem.cacheDirectory}hindustan-transactions.csv`;
  await FileSystem.writeAsStringAsync(path, header + body, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Export CSV" });
}

export async function exportMonthlyPdf(summary: {
  monthLabel: string;
  income: number;
  expense: number;
  topCategories: { name: string; amount: number }[];
}): Promise<void> {
  const rows = summary.topCategories
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td style="text-align:right">${r.amount.toFixed(2)}</td></tr>`,
    )
    .join("");
  const html = `
  <html><head><meta charset="utf-8"/><style>
    body { font-family: Helvetica, sans-serif; padding: 24px; color: #1A1A2E; }
    h1 { color: #6C63FF; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td { border-bottom: 1px solid #eee; padding: 8px; }
  </style></head><body>
    <h1>Hindustan Pay</h1>
    <h2>${summary.monthLabel} summary</h2>
    <p>Income: ${summary.income.toFixed(2)} · Expenses: ${summary.expense.toFixed(2)}</p>
    <h3>Top categories</h3>
    <table>${rows}</table>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export PDF" });
}
