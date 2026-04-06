import { useEffect } from "react";
import { useTransactionStore } from "@/store/useTransactionStore";

export function useTransactions() {
  const load = useTransactionStore((s) => s.loadTransactions);
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  useEffect(() => {
    load();
  }, [load]);
  return { transactions, isLoading, reload: load };
}
