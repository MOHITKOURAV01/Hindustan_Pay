import * as FileSystem from "expo-file-system/legacy";
import { format } from "date-fns";
import { generatePDF } from "react-native-html-to-pdf";
import { fetchTransactions, applyFilters } from "@/db/queries/transactions";
import { fetchAllCategories } from "@/db/queries/categories";
import type { FilterState } from "@/types/transaction";

function catName(id: string | null, byId: Map<string, string>): string {
  if (!id) return "";
  return byId.get(id) ?? id;
}

function escapeCsvCell(v: string | number | boolean | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportTransactionsToCSV(filters?: FilterState): Promise<string> {
  const rows = fetchTransactions();
  const list = filters ? applyFilters(rows, filters) : rows;
  const cats = fetchAllCategories();
  const byId = new Map(cats.map((c) => [c.id, c.name]));

  const header = ["id", "date", "type", "category", "title", "amount", "currency", "notes"];
  const lines = [
    header.join(","),
    ...list.map((t) =>
      [
        escapeCsvCell(t.id),
        escapeCsvCell(t.date),
        escapeCsvCell(t.type),
        escapeCsvCell(catName(t.categoryId, byId)),
        escapeCsvCell(t.title),
        escapeCsvCell(t.amount),
        escapeCsvCell(t.currency),
        escapeCsvCell(t.notes),
      ].join(","),
    ),
  ];
  const csv = lines.join("\n");
  const ymd = format(new Date(), "yyyyMMdd");
  const path = `${FileSystem.cacheDirectory}hindustan_export_${ymd}.csv`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  return path;
}

export async function exportSummaryPDF(): Promise<string> {
  const rows = fetchTransactions();
  const active = rows.filter((t) => !t.isDeleted && !t.isArchived);
  const now = Date.now();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const monthTx = active.filter((t) => t.date >= monthStart && t.date <= monthEnd);

  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  const cats = fetchAllCategories();
  const byId = new Map(cats.map((c) => [c.id, c.name]));
  const catTotals = new Map<string, number>();
  const catCounts = new Map<string, number>();
  for (const t of monthTx) {
    if (t.type !== "expense") continue;
    const id = t.categoryId ?? "none";
    catTotals.set(id, (catTotals.get(id) ?? 0) + t.amount);
    catCounts.set(id, (catCounts.get(id) ?? 0) + 1);
  }
  const catRows = [...catTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, amt]) => {
      const name = byId.get(id) ?? "Other";
      const pct = expense > 0 ? Math.round((amt / expense) * 100) : 0;
      const cnt = catCounts.get(id) ?? 0;
      return `<tr><td>${name}</td><td style="text-align:right">₹${amt.toFixed(0)}</td><td style="text-align:right">${pct}%</td><td style="text-align:right">${cnt}</td></tr>`;
    })
    .join("");

  const top10 = [...monthTx]
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((t) => {
      const d = format(t.date, "dd MMM yyyy");
      const title = (t.title ?? "Expense").replace(/</g, "&lt;");
      return `<tr><td>${title}</td><td style="text-align:right">₹${t.amount.toFixed(0)}</td><td>${d}</td></tr>`;
    })
    .join("");

  const exportDate = format(now, "dd MMM yyyy HH:mm");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; background: #1A1A27; color: #E8E8F0; }
    h1 { color: #6C63FF; margin-bottom: 4px; }
    .sub { color: #9A9AB8; font-size: 14px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; color: #6C63FF; border-bottom: 1px solid #6C63FF55; padding: 10px 8px; font-size: 13px; }
    td { border-bottom: 1px solid #2A2A3E; padding: 10px 8px; font-size: 13px; }
    .card { background: #12121E; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #6C63FF33; }
    .metric { font-size: 22px; font-weight: 700; color: #F0F0FF; }
  </style></head><body>
    <h1>Hindustan Pay</h1>
    <div class="sub">Summary export · ${exportDate}</div>
    <div class="card">
      <table>
        <tr><td>Total income (this month)</td><td class="metric" style="text-align:right">₹${income.toFixed(0)}</td></tr>
        <tr><td>Total expenses</td><td class="metric" style="text-align:right">₹${expense.toFixed(0)}</td></tr>
        <tr><td>Net balance</td><td class="metric" style="text-align:right">₹${net.toFixed(0)}</td></tr>
        <tr><td>Savings rate</td><td class="metric" style="text-align:right">${savingsRate}%</td></tr>
      </table>
    </div>
    <h2 style="color:#6C63FF;font-size:16px;">Category breakdown</h2>
    <table><thead><tr><th>Category</th><th>Amount</th><th>%</th><th>Count</th></tr></thead><tbody>${catRows}</tbody></table>
    <h2 style="color:#6C63FF;font-size:16px;margin-top:28px;">Top 10 expenses</h2>
    <table><thead><tr><th>Title</th><th>Amount</th><th>Date</th></tr></thead><tbody>${top10}</tbody></table>
  </body></html>`;

  const ymd = format(new Date(), "yyyyMMdd");
  const res = await generatePDF({
    html,
    fileName: `hindustan_summary_${ymd}`,
    base64: false,
    bgColor: "#1A1A27",
  });
  return res.filePath.startsWith("file://") ? res.filePath : `file://${res.filePath}`;
}

export function buildSampleCSV(): string {
  return [
    "amount,type,category,title,date,notes",
    "1200,expense,Food,Lunch,2026-04-01,Sample row",
    "45000,income,Salary,Payroll,2026-04-01,Sample income",
    "99.5,expense,Entertainment,Streaming,06/04/2026,Debit example",
  ].join("\n");
}
