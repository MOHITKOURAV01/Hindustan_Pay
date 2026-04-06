import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateHealthScore, type HealthScoreResult } from "@/utils/calculateHealthScore";
import { useTransactionStore } from "./useTransactionStore";
import { useGoalStore } from "./useGoalStore";
import { useEMIStore } from "./useEMIStore";

type HealthScoreState = {
  score: HealthScoreResult | null;
  lastCalculated: number;
  calculateScore: () => Promise<void>;
  loadStoredScore: () => Promise<void>;
};

export const useHealthScoreStore = create<HealthScoreState>((set) => ({
  score: null,
  lastCalculated: 0,
  calculateScore: async () => {
    const transactions = useTransactionStore.getState().transactions;
    const goals = useGoalStore.getState().goals;
    const emis = useEMIStore.getState().emis;

    const result = calculateHealthScore(transactions, goals, emis);
    const now = Date.now();
    
    set({ score: result, lastCalculated: now });

    // Persist to AsyncStorage
    await AsyncStorage.setItem("hp_health_score", JSON.stringify({
      score: result,
      lastCalculated: now
    }));
  },
  loadStoredScore: async () => {
    const stored = await AsyncStorage.getItem("hp_health_score");
    if (stored) {
      const parsed = JSON.parse(stored);
      set({ 
        score: parsed.score, 
        lastCalculated: parsed.lastCalculated || 0 
      });
    }
  },
}));

// Subscribe to store changes to auto-refresh health score without circular imports
useTransactionStore.subscribe(() => {
  void useHealthScoreStore.getState().calculateScore();
});
useGoalStore.subscribe(() => {
  void useHealthScoreStore.getState().calculateScore();
});
useEMIStore.subscribe(() => {
  void useHealthScoreStore.getState().calculateScore();
});
