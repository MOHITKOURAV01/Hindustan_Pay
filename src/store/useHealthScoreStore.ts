import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateHealthScore, type HealthScoreResult } from "@/utils/calculateHealthScore";

type HealthScoreState = {
  score: HealthScoreResult | null;
  history: { date: number; score: number }[];
  lastRefresh: number;
  refreshScore: (data: { transactions: any[]; goals: any[]; emis: any[] }, force?: boolean) => Promise<void>;
};

export const useHealthScoreStore = create<HealthScoreState>()(
  persist(
    (set, get) => ({
      score: null,
      history: [],
      lastRefresh: 0,
      refreshScore: async (data, force = false) => {
        const now = Date.now();
        const throttleMs = 60 * 60 * 1000; // 1 hour
        if (!force && now - get().lastRefresh < throttleMs && get().score) {
          return;
        }

        const { transactions, goals, emis } = data;
        const result = calculateHealthScore(transactions, goals, emis);
        
        const lastInHistory = get().history[get().history.length - 1];
        const isNewDay = !lastInHistory || new Date(lastInHistory.date).toDateString() !== new Date(now).toDateString();
        
        set((state) => ({
          score: result,
          lastRefresh: now,
          history: isNewDay ? [...state.history, { date: now, score: result.score }].slice(-30) : state.history,
        }));
      },
    }),
    {
      name: "hp_health_score",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
