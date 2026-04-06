import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { Insight } from "@/types/insight";
import { calculateInsights as compute } from "@/utils/calculateInsights";
import { useTransactionStore } from "./useTransactionStore";

const DISMISS_KEY = "hp_dismissed_insights";

type InsightStore = {
  insights: Insight[];
  lastCalculated: number;
  calculateInsights: () => Promise<void>;
  dismissInsight: (id: string) => Promise<void>;
};

export const useInsightStore = create<InsightStore>((set, get) => ({
  insights: [],
  lastCalculated: 0,
  calculateInsights: async () => {
    const raw = await AsyncStorage.getItem(DISMISS_KEY);
    let dismissed: string[] = [];
    try {
      dismissed = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      dismissed = [];
    }
    const transactions = useTransactionStore.getState().transactions;
    const insights = compute(transactions).filter((i) => !dismissed.includes(i.id));
    set({ insights, lastCalculated: Date.now() });
  },
  dismissInsight: async (id: string) => {
    const raw = await AsyncStorage.getItem(DISMISS_KEY);
    let list: string[] = [];
    try {
      list = raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      list = [];
    }
    if (!list.includes(id)) list.push(id);
    await AsyncStorage.setItem(DISMISS_KEY, JSON.stringify(list));
    await get().calculateInsights();
  },
}));
