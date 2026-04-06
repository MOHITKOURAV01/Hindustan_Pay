import { useHealthScoreStore } from "@/store/useHealthScoreStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useGoalStore } from "@/store/useGoalStore";
import { useEMIStore } from "@/store/useEMIStore";

export async function triggerHealthScoreRefresh(force = false) {
  try {
    const transactions = useTransactionStore.getState().transactions;
    const goals = useGoalStore.getState().goals;
    const emis = useEMIStore.getState().emis;
    
    await useHealthScoreStore.getState().refreshScore(
      { transactions, goals, emis },
      force
    );
  } catch (err) {
    console.error("[HealthScoreHelper] Failed to refresh score:", err);
  }
}
