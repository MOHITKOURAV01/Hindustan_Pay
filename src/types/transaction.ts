export type TransactionType = "income" | "expense";

export type RecurrenceRule = "daily" | "weekly" | "monthly" | "yearly";

export type PaymentMode =
  | "cash"
  | "upi_gpay"
  | "upi_phonepe"
  | "upi_paytm"
  | "upi_bhim"
  | "upi_amazonpay"
  | "upi_cred"
  | "card_credit"
  | "card_debit"
  | "net_banking"
  | "wallet"
  | "cheque"
  | "emi";

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  paymentMode?: PaymentMode | null;
  title: string | null;
  notes: string | null;
  date: number;
  createdAt: number;
  updatedAt: number;
  isRecurring: boolean;
  currency: string;
  isDeleted: boolean;
  isStarred: boolean;
  isArchived: boolean;
  recurrenceRule: RecurrenceRule | null;
  recurrenceEndDate: number | null;
  parentTransactionId: string | null;
};

export type FilterState = {
  datePreset: "week" | "month" | "lastMonth" | "custom" | "all";
  dateFrom?: number;
  dateTo?: number;
  categoryIds: string[];
  type: "all" | TransactionType;
  amountMin?: number;
  amountMax?: number;
  sort: "newest" | "oldest" | "amountHigh" | "amountLow";
};
