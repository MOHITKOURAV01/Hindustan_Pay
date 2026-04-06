export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "AED"
  | "SGD"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "BRL"
  | "ZAR"
  | "MXN"
  | "KRW";

export const CURRENCIES: {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rateFromInr: number;
}[] = [
  { code: "INR", symbol: "₹", label: "Indian Rupee", rateFromInr: 1 },
  { code: "USD", symbol: "$", label: "US Dollar", rateFromInr: 0.012 },
  { code: "EUR", symbol: "€", label: "Euro", rateFromInr: 0.011 },
  { code: "GBP", symbol: "£", label: "British Pound", rateFromInr: 0.0095 },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", rateFromInr: 1.8 },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", rateFromInr: 0.044 },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar", rateFromInr: 0.016 },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", rateFromInr: 0.016 },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", rateFromInr: 0.018 },
  { code: "CHF", symbol: "Fr", label: "Swiss Franc", rateFromInr: 0.0105 },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan", rateFromInr: 0.086 },
  { code: "BRL", symbol: "R$", label: "Brazilian Real", rateFromInr: 0.067 },
  { code: "ZAR", symbol: "R", label: "South African Rand", rateFromInr: 0.22 },
  { code: "MXN", symbol: "MX$", label: "Mexican Peso", rateFromInr: 0.2 },
  { code: "KRW", symbol: "₩", label: "Korean Won", rateFromInr: 16 },
];

export function getRateToInr(code: CurrencyCode): number {
  const row = CURRENCIES.find((c) => c.code === code);
  return row ? 1 / row.rateFromInr : 1;
}
