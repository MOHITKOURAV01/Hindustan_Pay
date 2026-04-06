export type GoalType = "savings" | "challenge" | "no-spend" | "budget";

export type Goal = {
  id: string;
  title: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  categoryId: string | null;
  deadline: number | null;
  emoji: string | null;
  color: string | null;
  streakCount: number;
  isCompleted: boolean;
  createdAt: number;
};

export type StreakEntry = {
  id: string;
  goalId: string;
  date: number;
  status: "success" | "fail" | "skip";
};
