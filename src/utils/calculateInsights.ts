import {
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getHours,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import type { Transaction } from "@/types/transaction";
import type { Insight, InsightKind } from "@/types/insight";
import type { Category } from "@/types/category";
import type { Goal } from "@/types/goal";

function categoryName(id: string | null, categories: Category[]): string {
  if (!id) return "Uncategorized";
  return categories.find((c) => c.id === id)?.name ?? "Other";
}

function pushInsight(
  list: Insight[],
  id: string,
  type: InsightKind,
  title: string,
  body: string,
  tone: Insight["tone"],
  icon: string,
  color: string,
  value?: number,
) {
  list.push({
    id,
    type,
    title,
    body,
    icon,
    color,
    value,
    tone,
    dismissible: true,
  });
}

export function calculateInsights(
  transactions: Transaction[],
  categories: Category[] = [],
  goals: Goal[] = [],
): Insight[] {
  const active = transactions.filter((t) => !t.isDeleted && !t.isArchived);
  const now = Date.now();
  const thisMonthStart = startOfMonth(now).getTime();
  const thisMonthEnd = endOfMonth(now).getTime();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).getTime();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).getTime();

  const thisMonth = active.filter((t) => t.date >= thisMonthStart && t.date <= thisMonthEnd);
  const lastMonth = active.filter((t) => t.date >= lastMonthStart && t.date <= lastMonthEnd);

  const insights: Insight[] = [];

  const sumByCat = (list: Transaction[], type: "expense" | "income") => {
    const m = new Map<string, number>();
    for (const t of list) {
      if (t.type !== type) continue;
      const k = t.categoryId ?? "none";
      m.set(k, (m.get(k) ?? 0) + t.amount);
    }
    return m;
  };

  const expThis = sumByCat(thisMonth, "expense");
  const expLast = sumByCat(lastMonth, "expense");
  const expenseTotalThis = [...expThis.values()].reduce((a, b) => a + b, 0);

  let topCat: string | null = null;
  let topAmt = 0;
  expThis.forEach((v, k) => {
    if (v > topAmt) {
      topAmt = v;
      topCat = k;
    }
  });

  if (topCat && topAmt > 0 && expenseTotalThis > 0) {
    const pct = Math.round((topAmt / expenseTotalThis) * 100);
    const name = categoryName(topCat, categories);
    pushInsight(
      insights,
      "insight_TOP_CATEGORY",
      "TOP_CATEGORY",
      "Top spending category",
      `${name} is your biggest expense — ₹${Math.round(topAmt)} this month (${pct}% of total)`,
      "info",
      "trophy",
      "#6C63FF",
      pct,
    );
  }

  const ws = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const we = endOfWeek(now, { weekStartsOn: 1 }).getTime();
  const lws = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }).getTime();
  const lwe = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }).getTime();
  const spendWeek = active
    .filter((t) => t.type === "expense" && t.date >= ws && t.date <= we)
    .reduce((s, t) => s + t.amount, 0);
  const spendLastWeek = active
    .filter((t) => t.type === "expense" && t.date >= lws && t.date <= lwe)
    .reduce((s, t) => s + t.amount, 0);
  const diffWeek = spendWeek - spendLastWeek;
  if (spendLastWeek > 0 || spendWeek > 0) {
    const more = diffWeek > 0;
    pushInsight(
      insights,
      "insight_WEEK_COMPARISON",
      "WEEK_COMPARISON",
      "Weekly spending",
      `You spent ${more ? "more" : "less"} this week — ₹${Math.abs(Math.round(diffWeek))} ${more ? "more" : "less"} than last week`,
      more ? "warning" : "success",
      "chart-line",
      more ? "#FF6B9D" : "#00D4AA",
      diffWeek,
    );
  }

  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const t of thisMonth) {
    if (t.type !== "expense") continue;
    const d = getDay(t.date);
    byWeekday[d] += t.amount;
    counts[d] += 1;
  }
  let bestD = 0;
  let bestAvg = Infinity;
  let sumAvgOthers = 0;
  let cntOthers = 0;
  for (let d = 0; d < 7; d++) {
    if (counts[d] === 0) continue;
    const avg = byWeekday[d] / counts[d];
    if (avg < bestAvg) {
      bestAvg = avg;
      bestD = d;
    }
  }
  for (let d = 0; d < 7; d++) {
    if (d === bestD || counts[d] === 0) continue;
    sumAvgOthers += byWeekday[d] / counts[d];
    cntOthers += 1;
  }
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (bestAvg < Infinity && cntOthers > 0) {
    const otherAvg = sumAvgOthers / cntOthers;
    const delta = Math.max(0, otherAvg - bestAvg);
    pushInsight(
      insights,
      "insight_BEST_DAY",
      "BEST_DAY",
      "Calmer day",
      `You spend least on ${days[bestD]} — avg ₹${Math.round(delta)} less than other days`,
      "success",
      "calendar-star",
      "#00D4AA",
    );
  }

  const hourCounts = new Array(24).fill(0);
  for (const t of thisMonth) {
    if (t.type !== "expense") continue;
    hourCounts[getHours(t.date)] += 1;
  }
  let peakH = 0;
  let peakC = 0;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > peakC) {
      peakC = hourCounts[h];
      peakH = h;
    }
  }
  if (peakC > 0) {
    const evening = peakH >= 17 || peakH <= 5;
    const body = evening
      ? "Most of your spending happens in the evening — worth a quick budget check-in."
      : "Most of your transactions cluster midday — stay mindful of small purchases adding up.";
    pushInsight(insights, "insight_PEAK_TIME", "PEAK_TIME", "Peak activity", body, "info", "clock-outline", "#FFB347");
  }

  const streakGoal = goals.find((g) => !g.isCompleted && g.streakCount > 0);
  if (streakGoal) {
    pushInsight(
      insights,
      "insight_STREAK_STATUS",
      "STREAK_STATUS",
      "Streak",
      `You're on a ${streakGoal.streakCount}-day streak for ${streakGoal.title}! Keep it up.`,
      "success",
      "fire",
      "#FF6B9D",
      streakGoal.streakCount,
    );
  }

  const income = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = expenseTotalThis;
  if (income > 0) {
    const rate = Math.round(((income - expense) / income) * 100);
    pushInsight(
      insights,
      "insight_SAVINGS_RATE",
      "SAVINGS_RATE",
      "Savings rate",
      `You saved ${rate}% of your income this month`,
      rate >= 20 ? "success" : "warning",
      "piggy-bank",
      rate >= 20 ? "#00D4AA" : "#FFB347",
      rate,
    );
  }

  const titleMonth = new Map<string, Set<string>>();
  for (const t of active) {
    if (t.type !== "expense" || !t.title) continue;
    const key = t.title.trim().toLowerCase();
    const ym = format(t.date, "yyyy-MM");
    if (!titleMonth.has(key)) titleMonth.set(key, new Set());
    titleMonth.get(key)!.add(ym);
  }
  for (const [title, months] of titleMonth) {
    if (months.size < 2) continue;
    const samples = active.filter(
      (t) => t.type === "expense" && t.title && t.title.trim().toLowerCase() === title,
    );
    const avg = samples.reduce((s, t) => s + t.amount, 0) / Math.max(1, samples.length);
    const pretty = samples[0]?.title ?? title;
    pushInsight(
      insights,
      "insight_RECURRING_DETECTOR",
      "RECURRING_DETECTOR",
      "Recurring pattern",
      `Looks like ${pretty} is a recurring expense — about ₹${Math.round(avg)}/entry`,
      "info",
      "repeat",
      "#8888AA",
    );
    break;
  }

  const expensesThis = thisMonth.filter((t) => t.type === "expense");
  if (expensesThis.length) {
    const largest = [...expensesThis].sort((a, b) => b.amount - a.amount)[0];
    const dlabel = format(largest.date, "d MMM");
    const ttl = largest.title ?? "Purchase";
    pushInsight(
      insights,
      "insight_LARGEST_TRANSACTION",
      "LARGEST_TRANSACTION",
      "Largest expense",
      `Your largest expense was ${ttl} — ₹${Math.round(largest.amount)} on ${dlabel}`,
      "warning",
      "arrow-up-bold",
      "#FF6B9D",
      largest.amount,
    );
  }

  let spikeWinner: { catId: string; spike: number } | null = null;
  for (const [catId, amt] of expThis.entries()) {
    const prev = expLast.get(catId) ?? 0;
    if (prev <= 0 || amt <= 0) continue;
    const spikePct = ((amt - prev) / prev) * 100;
    if (spikePct > 30 && (!spikeWinner || spikePct > spikeWinner.spike)) {
      spikeWinner = { catId, spike: spikePct };
    }
  }
  if (spikeWinner) {
    const w = spikeWinner;
    pushInsight(
      insights,
      `insight_SPIKE_${w.catId}`,
      "CATEGORY_SPIKE",
      "Category spike",
      `${categoryName(w.catId, categories)} spending spiked ${Math.round(w.spike)}% vs last month`,
      "warning",
      "trending-up",
      "#FF6B9D",
      w.spike,
    );
  }

  const last3 = [0, 1, 2].map((i) => {
    const d = subMonths(now, i);
    const s = startOfMonth(d).getTime();
    const e = endOfMonth(d).getTime();
    return active.filter((t) => t.type === "expense" && t.date >= s && t.date <= e).reduce((sum, t) => sum + t.amount, 0);
  });
  const [curExp, prev1Exp, prev2Exp] = last3;
  if (curExp > 0 && prev1Exp > 0 && prev2Exp > 0) {
    const down = curExp < prev1Exp && prev1Exp < prev2Exp;
    const up = curExp > prev1Exp && prev1Exp > prev2Exp;
    if (down || up) {
      pushInsight(
        insights,
        "insight_MONTHLY_TREND",
        "MONTHLY_TREND",
        "3-month trend",
        `Your overall spending has been ${down ? "trending down" : "trending up"} over the last 3 months`,
        down ? "success" : "warning",
        "chart-timeline-variant",
        down ? "#00D4AA" : "#FF6B9D",
      );
    }
  }

  const catAverages = new Map<string, number>();
  for (let i = 1; i <= 3; i++) {
    const d = subMonths(now, i);
    const s = startOfMonth(d).getTime();
    const e = endOfMonth(d).getTime();
    const mtx = active.filter((t) => t.type === "expense" && t.date >= s && t.date <= e);
    const msum = sumByCat(mtx, "expense");
    msum.forEach((val, catId) => {
      catAverages.set(catId, (catAverages.get(catId) ?? 0) + val / 3);
    });
  }

  expThis.forEach((thisMonthVal, catId) => {
    const avg = catAverages.get(catId) ?? 0;
    if (avg > 0 && thisMonthVal > avg * 1.25) {
      const diff = thisMonthVal - avg;
      const name = categoryName(catId, categories);
      pushInsight(
        insights,
        `suggestion_SAVINGS_${catId}`,
        "SAVINGS_SUGGESTION",
        "Savings opportunity",
        `You've spent ₹${Math.round(diff)} more on ${name} than your 3-month average. Reducing this could save you ₹${Math.round(diff)} next month!`,
        "info",
        "lightbulb-on-outline",
        "#FFB347",
        thisMonthVal,
      );
    }
  });

  const seen = new Set<string>();
  return insights.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}
