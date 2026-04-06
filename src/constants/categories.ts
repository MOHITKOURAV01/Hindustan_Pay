export type CategoryDef = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
};

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: "cat_other", name: "Other", icon: "help-circle-outline", color: "#8888AA", type: "expense" },
  { id: "cat_food", name: "Food", icon: "food", color: "#FF6B9D", type: "expense" },
  { id: "cat_transport", name: "Transport", icon: "car", color: "#6C63FF", type: "expense" },
  { id: "cat_entertainment", name: "Entertainment", icon: "movie", color: "#FFB347", type: "expense" },
  { id: "cat_health", name: "Health", icon: "heart-pulse", color: "#4CAF82", type: "expense" },
  { id: "cat_shopping", name: "Shopping", icon: "shopping", color: "#00D4AA", type: "expense" },
  { id: "cat_salary", name: "Salary", icon: "cash", color: "#6C63FF", type: "income" },
  { id: "cat_freelance", name: "Freelance", icon: "laptop", color: "#00D4AA", type: "income" },
  { id: "cat_rent", name: "Rent", icon: "home", color: "#FF5C5C", type: "expense" },
  { id: "cat_utilities", name: "Utilities", icon: "flash", color: "#FFB347", type: "expense" },
  { id: "cat_subscriptions", name: "Subscriptions", icon: "youtube-subscription", color: "#8888AA", type: "expense" },
  { id: "cat_travel", name: "Travel", icon: "airplane", color: "#6C63FF", type: "expense" },
  { id: "cat_education", name: "Education", icon: "school", color: "#4CAF82", type: "expense" },
  { id: "cat_investments", name: "Investments", icon: "chart-line", color: "#00D4AA", type: "both" },
  { id: "cat_gifts", name: "Gifts", icon: "gift", color: "#FF6B9D", type: "expense" },
  { id: "cat_personal_care", name: "Personal Care", icon: "face-woman", color: "#FFB347", type: "expense" },
  { id: "cat_groceries", name: "Groceries", icon: "cart", color: "#4CAF82", type: "expense" },
  { id: "cat_dining", name: "Dining Out", icon: "silverware-fork-knife", color: "#FF6B9D", type: "expense" },
  { id: "cat_gym", name: "Gym", icon: "dumbbell", color: "#6C63FF", type: "expense" },
  { id: "cat_insurance", name: "Insurance", icon: "shield-check", color: "#8888AA", type: "expense" },
  { id: "cat_medical", name: "Medical", icon: "medical-bag", color: "#FF5C5C", type: "expense" },
];
