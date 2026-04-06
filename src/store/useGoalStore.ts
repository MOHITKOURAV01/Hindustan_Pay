import { nanoid } from "nanoid/non-secure";
import { create } from "zustand";
import type { Goal, StreakEntry } from "@/types/goal";
import {
  deleteGoalRow,
  fetchGoals,
  fetchStreaks,
  insertGoal,
  insertStreak,
  updateGoal,
} from "@/db/queries/goals";
import { triggerHealthScoreRefresh } from "@/utils/healthScoreHelper";
import { Analytics } from "@/utils/analytics";

type GoalStore = {
  goals: Goal[];
  streaks: StreakEntry[];
  loadGoals: () => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt"> & { id?: string }) => void;
  updateGoalById: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  recordStreakEntry: (e: Omit<StreakEntry, "id"> & { id?: string }) => void;
  checkStreaks: () => void;
  celebratingGoalId: string | null;
  setCelebratingGoalId: (id: string | null) => void;
};

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  streaks: [],
  loadGoals: () => {
    set({
      goals: fetchGoals(),
      streaks: fetchStreaks(),
    });
  },
  addGoal: (g) => {
    const now = Date.now();
    const full: Goal = {
      id: g.id ?? nanoid(),
      title: g.title,
      type: g.type,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount ?? 0,
      categoryId: g.categoryId ?? null,
      deadline: g.deadline ?? null,
      emoji: g.emoji ?? "🎯",
      color: g.color ?? "#6C63FF",
      streakCount: g.streakCount ?? 0,
      isCompleted: g.isCompleted ?? false,
      createdAt: now,
    };
    insertGoal(full);
    get().loadGoals();
  },
  updateGoalById: (id, patch) => {
    updateGoal(id, patch);
    get().loadGoals();
  },
  deleteGoal: (id) => {
    deleteGoalRow(id);
    get().loadGoals();
  },
  contributeToGoal: (id, amount) => {
    const g = get().goals.find((x) => x.id === id);
    if (!g) return;
    const next = Math.min(g.targetAmount, g.currentAmount + amount);
    const isComp = next >= g.targetAmount;
    updateGoal(id, { currentAmount: next, isCompleted: isComp });
    if (isComp && !g.isCompleted) set({ celebratingGoalId: id });
    get().loadGoals();
    void triggerHealthScoreRefresh();
  },
  recordStreakEntry: (e) => {
    const row: StreakEntry = {
      id: e.id ?? nanoid(),
      goalId: e.goalId,
      date: e.date,
      status: e.status,
    };
    insertStreak(row);
    get().loadGoals();
  },
  checkStreaks: () => {
    get().loadGoals();
  },
  celebratingGoalId: null,
  setCelebratingGoalId: (id) => set({ celebratingGoalId: id }),
}));
