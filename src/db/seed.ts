import { addDays, addHours, subDays } from "date-fns";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid/non-secure";
import { db } from "./client";
import * as schema from "./schema";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { INDIAN_CATEGORIES } from "@/constants/indianFinance";

const expensePool = DEFAULT_CATEGORIES.filter((c) => c.type === "expense" || c.type === "both");
const incomePool = DEFAULT_CATEGORIES.filter((c) => c.type === "income" || c.type === "both");

function ensureDefaultCategories() {
  for (const c of DEFAULT_CATEGORIES) {
    db.insert(schema.categories)
      .values({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        isCustom: false,
      })
      .onConflictDoNothing()
      .run();
  }
}

function ensureIndianCategories() {
  for (const c of INDIAN_CATEGORIES) {
    db.insert(schema.categories)
      .values({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: "expense",
        isCustom: false,
      })
      .onConflictDoNothing()
      .run();
  }
}

export function seedDatabaseIfEmpty() {
  ensureDefaultCategories();
  ensureIndianCategories();

  const seeded = db.select().from(schema.settings).where(eq(schema.settings.key, "seeded")).get();
  if (seeded) return;

  const now = Date.now();

  const titlesExpense = [
    "Groceries run",
    "Uber ride",
    "Coffee",
    "Movie night",
    "Pharmacy",
    "Online order",
    "Fuel",
    "Lunch meeting",
    "Streaming",
    "Gym pass",
  ];
  const titlesIncome = ["Salary credit", "Client payment", "Refund", "Cashback", "Side project"];

  for (let i = 0; i < 60; i++) {
    const isIncome = Math.random() < 0.22;
    const day = subDays(now, Math.floor(Math.random() * 90));
    const date = addHours(day, Math.floor(Math.random() * 12) + 8).getTime();
    const cat = isIncome
      ? incomePool[Math.floor(Math.random() * incomePool.length)]
      : expensePool[Math.floor(Math.random() * expensePool.length)];
    const amount = isIncome
      ? Math.round(8000 + Math.random() * 42000)
      : Math.round(120 + Math.random() * 4800);
    const titleList = isIncome ? titlesIncome : titlesExpense;
    db.insert(schema.transactions)
      .values({
        id: nanoid(),
        amount,
        type: isIncome ? "income" : "expense",
        categoryId: cat.id,
        title: titleList[Math.floor(Math.random() * titleList.length)],
        notes: Math.random() > 0.7 ? "Auto-seeded demo entry" : null,
        date,
        createdAt: now,
        updatedAt: now,
        isRecurring: false,
        currency: "INR",
        isDeleted: false,
        isStarred: false,
        isArchived: false,
        recurrenceRule: null,
        recurrenceEndDate: null,
        parentTransactionId: null,
      })
      .run();
  }

  db.insert(schema.goals)
    .values({
      id: "goal_vacation",
      title: "Vacation Fund",
      type: "savings",
      targetAmount: 50000,
      currentAmount: 12000,
      categoryId: null,
      deadline: addDays(now, 120).getTime(),
      emoji: "✈️",
      color: "#6C63FF",
      streakCount: 5,
      isCompleted: false,
      createdAt: now,
    })
    .run();

  db.insert(schema.goals)
    .values({
      id: "goal_emergency",
      title: "Emergency Fund",
      type: "savings",
      targetAmount: 100000,
      currentAmount: 34000,
      categoryId: null,
      deadline: addDays(now, 200).getTime(),
      emoji: "🛡️",
      color: "#00D4AA",
      streakCount: 12,
      isCompleted: false,
      createdAt: now,
    })
    .run();

  db.insert(schema.goals)
    .values({
      id: "goal_nocoffee",
      title: "No Coffee for 7 Days",
      type: "no-spend",
      targetAmount: 7,
      currentAmount: 2,
      categoryId: "cat_dining",
      deadline: addDays(now, 7).getTime(),
      emoji: "☕",
      color: "#FF6B9D",
      streakCount: 2,
      isCompleted: false,
      createdAt: now,
    })
    .run();

  for (let d = 0; d < 7; d++) {
    db.insert(schema.streakEntries)
      .values({
        id: nanoid(),
        goalId: "goal_nocoffee",
        date: subDays(now, d).setHours(12, 0, 0, 0),
        status: d < 2 ? "success" : "skip",
      })
      .run();
  }

  db.insert(schema.budgets)
    .values({
      id: "bud_food",
      categoryId: "cat_food",
      monthlyLimit: 12000,
      month: Number(
        `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      ),
      alertThresholdPct: 80,
    })
    .run();

  db.insert(schema.emi)
    .values({
      id: "emi_sample_home",
      name: "Home Loan",
      bank: "SBI",
      totalAmount: 5000000,
      emiAmount: 42500,
      interestRate: 8.5,
      tenureMonths: 240,
      startDate: subDays(now, 180).getTime(),
      nextDueDate: addDays(now, 15).getTime(),
      remainingMonths: 234,
      isActive: true,
      createdAt: now,
    })
    .run();

  db.insert(schema.settings).values({ key: "seeded", value: "1" }).run();
}
