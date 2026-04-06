import { CURRENCIES, type CurrencyCode } from "@/constants/currencies";

export function formatCurrency(
  amountInBaseInr: number,
  displayCode: CurrencyCode = "INR",
  options?: { compact?: boolean },
): string {
  const row = CURRENCIES.find((c) => c.code === displayCode) ?? CURRENCIES[0];
  const converted = amountInBaseInr * row.rateFromInr;
  const abs = Math.abs(converted);
  const formatted = options?.compact
    ? new Intl.NumberFormat("en-IN", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(abs)
    : new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(abs);
  const sign = converted < 0 ? "-" : "";
  return `${sign}${row.symbol} ${formatted}`;
}
