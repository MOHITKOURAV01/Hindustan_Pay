import type { Transaction } from "@/types/transaction";
import type { Goal } from "@/types/goal";
import type { EMI } from "@/types/emi";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export type SavingsSuggestion = {
  id: string;
  title: string;
  description: string;
  estimatedSaving: number;
  priority: "low" | "medium" | "high";
  icon: string;
};

export function getSavingsSuggestions(
  transactions: Transaction[],
  goals: Goal[],
  emis: EMI[]
): SavingsSuggestion[] {
  const suggestions: SavingsSuggestion[] = [];
  const now = Date.now();
  const monthStart = startOfMonth(now).getTime();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).getTime();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).getTime();

  const active = transactions.filter(t => !t.isDeleted);
  const currentMonthExpenses = active.filter(t => t.type === "expense" && t.date >= monthStart);
  const lastMonthExpenses = active.filter(t => t.type === "expense" && t.date >= lastMonthStart && t.date <= lastMonthEnd);

  // 1. Subscription audit
  const possibleSubscriptions = active.filter(t => 
    t.type === "expense" && 
    (t.title?.toLowerCase().includes("premium") || t.title?.toLowerCase().includes("sub"))
  );
  if (possibleSubscriptions.length > 2) {
    suggestions.push({
      id: "sub_audit",
      title: "Subscription Audit",
      description: "You have multiple recurring payments. Consider canceling unused ones.",
      estimatedSaving: 500,
      priority: "medium",
      icon: "card-remove-outline",
    });
  }

  // 2. Dining out spike
  const diningExp = currentMonthExpenses.filter(t => t.categoryId === "food_dining" || t.title?.toLowerCase().includes("zomato") || t.title?.toLowerCase().includes("swiggy"));
  const diningTotal = diningExp.reduce((sum, t) => sum + t.amount, 0);
  if (diningTotal > 5000) {
    suggestions.push({
      id: "dining_limit",
      title: "Dining Out",
      description: "You've spent a lot on food delivery this month. Cooking at home could save more.",
      estimatedSaving: diningTotal * 0.2,
      priority: "high",
      icon: "silverware-fork-knife",
    });
  }

  // 3. Goal nudge
  const incompleteGoals = goals.filter(g => !g.isCompleted);
  if (incompleteGoals.length > 0) {
    suggestions.push({
      id: "goal_nudge",
      title: "Goal Momentum",
      description: `Put small amounts into your '${incompleteGoals[0].title}' goal to finish faster.`,
      estimatedSaving: 0,
      priority: "low",
      icon: "bullseye-arrow",
    });
  }

  // 4. EMI reminder
  const highInterestEMIs = emis.filter(e => (e.interestRate || 0) > 12);
  if (highInterestEMIs.length > 0) {
    suggestions.push({
      id: "emi_prepay",
      title: "High Interest Debt",
      description: "Prepaying high-interest EMIs saves significant long-term interest.",
      estimatedSaving: 2000,
      priority: "high",
      icon: "bank-transfer-out",
    });
  }

  return suggestions;
}
