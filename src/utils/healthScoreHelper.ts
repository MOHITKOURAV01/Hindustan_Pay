import { useHealthScoreStore } from "@/store/useHealthScoreStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useGoalStore } from "@/store/useGoalStore";
import { useEMIStore } from "@/store/useEMIStore";

export async function triggerHealthScoreRefresh() {
  try {
    await useHealthScoreStore.getState().calculateScore();
  } catch (err) {
    console.error("[HealthScoreHelper] Failed to refresh score:", err);
  }
}
