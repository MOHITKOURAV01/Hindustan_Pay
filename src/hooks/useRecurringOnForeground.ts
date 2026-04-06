import { useEffect, useCallback } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/useAuthStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { processRecurringTransactions } from "@/utils/recurringTransactions";

const STORAGE_KEY = "hp_recurring_last_run";

export function useRecurringOnForeground() {
  const unlocked = useAuthStore((s) => s.isUnlocked);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);

  const runIfDue = useCallback(async () => {
    if (!useAuthStore.getState().isUnlocked) return;
    const dayKey = new Date().toISOString().slice(0, 10);
    const last = await AsyncStorage.getItem(STORAGE_KEY);
    if (last === dayKey) return;
    const n = processRecurringTransactions();
    await AsyncStorage.setItem(STORAGE_KEY, dayKey);
    if (n > 0) loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!unlocked) return;
    void runIfDue();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void runIfDue();
    });
    return () => sub.remove();
  }, [unlocked, runIfDue]);
}
