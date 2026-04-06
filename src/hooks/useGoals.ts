import { useEffect } from "react";
import { useGoalStore } from "@/store/useGoalStore";

export function useGoals() {
  const load = useGoalStore((s) => s.loadGoals);
  const goals = useGoalStore((s) => s.goals);
  useEffect(() => {
    load();
  }, [load]);
  return { goals, reload: load };
}
