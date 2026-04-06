import { eq } from "drizzle-orm";
import { db } from "../client";
import { goals, streakEntries } from "../schema";
import type { Goal, StreakEntry } from "@/types/goal";

function mapGoal(r: typeof goals.$inferSelect): Goal {
  return {
    id: r.id,
    title: r.title,
    type: r.type as Goal["type"],
    targetAmount: r.targetAmount,
    currentAmount: r.currentAmount,
    categoryId: r.categoryId,
    deadline: r.deadline,
    emoji: r.emoji,
    color: r.color,
    streakCount: r.streakCount,
    isCompleted: r.isCompleted,
    createdAt: r.createdAt,
  };
}

function mapStreak(r: typeof streakEntries.$inferSelect): StreakEntry {
  return {
    id: r.id,
    goalId: r.goalId,
    date: r.date,
    status: r.status as StreakEntry["status"],
  };
}

export function fetchGoals(): Goal[] {
  return db.select().from(goals).all().map(mapGoal);
}

export function fetchStreaks(): StreakEntry[] {
  return db.select().from(streakEntries).all().map(mapStreak);
}

export function insertGoal(g: Goal) {
  db.insert(goals)
    .values({
      id: g.id,
      title: g.title,
      type: g.type,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      categoryId: g.categoryId,
      deadline: g.deadline,
      emoji: g.emoji,
      color: g.color,
      streakCount: g.streakCount,
      isCompleted: g.isCompleted,
      createdAt: g.createdAt,
    })
    .run();
}

export function updateGoal(id: string, patch: Partial<Goal>) {
  db.update(goals).set(patch).where(eq(goals.id, id)).run();
}

export function insertStreak(e: StreakEntry) {
  db.insert(streakEntries)
    .values({
      id: e.id,
      goalId: e.goalId,
      date: e.date,
      status: e.status,
    })
    .run();
}

export function deleteGoalRow(id: string) {
  db.delete(streakEntries).where(eq(streakEntries.goalId, id)).run();
  db.delete(goals).where(eq(goals.id, id)).run();
}
