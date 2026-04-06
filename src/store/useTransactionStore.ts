// Force rebuild
import "react-native-gesture-handler";
import { create } from "zustand";
import type { FilterState, Transaction } from "@/types/transaction";
// Removed triggerHealthScoreRefresh to break require cycle
// Force rebuild to resolve stale bundle ReferenceError
import {
  applyFilters,
  fetchTransactions,
  insertTransaction as dbInsert,
  softDeleteTransaction,
  softDeleteTransactions,
  toggleArchiveTransaction,
  toggleStarTransaction,
  updateTransaction as dbUpdate,
} from "@/db/queries/transactions";
import { Analytics } from "@/utils/analytics";

export const defaultTransactionFilters: FilterState = {
  datePreset: "all",
  categoryIds: [],
  type: "all",
  sort: "newest",
  dateFrom: undefined,
  dateTo: undefined,
  amountMin: undefined,
  amountMax: undefined,
};

type TxStore = {
  transactions: Transaction[];
  filters: FilterState;
  isLoading: boolean;
  loadTransactions: () => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  bulkDeleteTransactions: (ids: string[]) => void;
  setFilters: (f: Partial<FilterState>) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  starTransaction: (id: string, starred: boolean) => void;
  archiveTransaction: (id: string, archived: boolean) => void;
  filtered: () => Transaction[];
};

export const useTransactionStore = create<TxStore>((set, get) => ({
  transactions: [],
  filters: defaultTransactionFilters,
  isLoading: true,
  loadTransactions: () => {
    set({ isLoading: true });
    const transactions = fetchTransactions();
    set({ transactions, isLoading: false });
  },
  addTransaction: (t) => {
    dbInsert(t);
    Analytics.track("transaction_added", { amount: t.amount, category: t.categoryId });
    get().loadTransactions();
  },
  updateTransaction: (id, patch) => {
    dbUpdate(id, patch);
    get().loadTransactions();
  },
  deleteTransaction: (id) => {
    softDeleteTransaction(id);
    get().loadTransactions();
  },
  bulkDeleteTransactions: (ids) => {
    softDeleteTransactions(ids);
    get().loadTransactions();
  },
  setFilters: (f) =>
    set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: { ...defaultTransactionFilters } }),
  clearFilters: () => get().resetFilters(),
  starTransaction: (id, starred) => {
    toggleStarTransaction(id, starred);
    get().loadTransactions();
  },
  archiveTransaction: (id, archived) => {
    toggleArchiveTransaction(id, archived);
    get().loadTransactions();
  },
  filtered: () => applyFilters(get().transactions, get().filters),
}));
