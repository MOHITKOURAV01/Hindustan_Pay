import { useEffect } from "react";
import { useInsightStore } from "@/store/useInsightStore";
import { useTransactionStore } from "@/store/useTransactionStore";

export function useInsights() {
  const insights = useInsightStore((s) => s.insights);
  const calculate = useInsightStore((s) => s.calculateInsights);
  const txLen = useTransactionStore((s) => s.transactions.length);
  useEffect(() => {
    void calculate();
  }, [calculate, txLen]);
  return { insights, refresh: calculate };
}
