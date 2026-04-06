import { endOfMonth, startOfMonth } from "date-fns";
import type { Transaction } from "@/types/transaction";
import type { Goal } from "@/types/goal";
import type { EMI } from "@/types/emi";
import { currentBudgetMonthKey, fetchActiveBudgetsForMonth, monthKeyToRange } from "@/db/queries/budgets";

export type HealthScoreResult = {
  score: number; // 0-100
  grade: string; // A+, A, B, etc.
  label: string; // Excellent, Good, etc.
  color: string;
  breakdown: {
    savingsRate: number;
    budgetDiscipline: number;
    emiBurden: number;
    consistency: number;
    goalProgress: number;
  };
};

export function calculateHealthScore(
  transactions: Transaction[],
  goals: Goal[],
  emis: EMI[],
): HealthScoreResult {
  const now = Date.now();
  const monthStart = startOfMonth(now).getTime();
  const monthEnd = endOfMonth(now).getTime();
  const active = transactions.filter((t) => !t.isDeleted && !t.isArchived);
  
  // 1. Savings Rate (25%)
  let inc = 0;
  let exp = 0;
  for (const t of active) {
    if (t.date >= monthStart && t.date <= monthEnd) {
      if (t.type === "income") inc += t.amount;
      else exp += t.amount;
    }
  }
  const savingsRateVal = inc > 0 ? Math.max(0, (inc - exp) / inc) : 0;
  const savingsScore = Math.min(1, savingsRateVal / 0.3); // 30% or more is 1.0

  // 2. Budget Discipline (25%)
  const budgets = fetchActiveBudgetsForMonth(currentBudgetMonthKey());
  let budgetDisciplineScore = 1;
  if (budgets.length > 0) {
    let withinBudget = 0;
    for (const b of budgets) {
      const { startMs, endMs } = monthKeyToRange(b.month);
      const spent = active
        .filter((t) => t.type === "expense" && t.categoryId === b.categoryId && t.date >= startMs && t.date <= endMs)
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent <= b.monthlyLimit) withinBudget++;
    }
    budgetDisciplineScore = withinBudget / budgets.length;
  }

  // 3. EMI Burden (20%)
  const totalEMI = emis.filter((e) => e.isActive).reduce((sum, e) => sum + e.emiAmount, 0);
  const emiBurdenVal = inc > 0 ? totalEMI / inc : totalEMI > 0 ? 1 : 0;
  const emiScore = Math.max(0, 1 - emiBurdenVal / 0.4); // >40% burden is 0 score

  // 4. Expense Consistency (15%) - Simplified as "Days without excessive spending"
  const dailyAverage = exp / 30;
  const daysInMonth = new Date(now).getDate();
  const dailySpending = new Array(daysInMonth).fill(0);
  for (const t of active) {
    if (t.type === "expense" && t.date >= monthStart && t.date <= monthEnd) {
      const d = new Date(t.date).getDate() - 1;
      if (d >= 0 && d < daysInMonth) dailySpending[d] += t.amount;
    }
  }
  const consistentDays = dailySpending.filter((amt) => amt <= dailyAverage * 1.5).length;
  const consistencyScore = consistentDays / daysInMonth;

  // 5. Goal Progress (15%)
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const goalProgressScore = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / activeGoals.length
    : 1.0;

  // Final Weighted Score
  const finalScore = (
    savingsScore * 0.25 +
    budgetDisciplineScore * 0.25 +
    emiScore * 0.2 +
    consistencyScore * 0.15 +
    goalProgressScore * 0.15
  ) * 100;

  let grade = "F";
  let label = "Poor";
  let color = "#FF5C5C";

  if (finalScore >= 95) { grade = "A+"; label = "Excellent"; color = "#4CAF50"; }
  else if (finalScore >= 85) { grade = "A"; label = "Very Good"; color = "#81C784"; }
  else if (finalScore >= 75) { grade = "B"; label = "Good"; color = "#FFD54F"; }
  else if (finalScore >= 60) { grade = "C"; label = "Average"; color = "#FFB74D"; }
  else if (finalScore >= 40) { grade = "D"; label = "Below Average"; color = "#FF8A65"; }

  return {
    score: Math.round(finalScore),
    grade,
    label,
    color,
    breakdown: {
      savingsRate: Math.round(savingsScore * 100),
      budgetDiscipline: Math.round(budgetDisciplineScore * 100),
      emiBurden: Math.round(emiScore * 100),
      consistency: Math.round(consistencyScore * 100),
      goalProgress: Math.round(goalProgressScore * 100),
    },
  };
}
