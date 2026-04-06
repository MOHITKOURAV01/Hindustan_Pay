import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { format } from "date-fns";
import { Platform } from "react-native";
import type { NotificationSettings } from "@/store/useSettingsStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { EMI } from "@/types/emi";
import {
  currentBudgetMonthKey,
  fetchActiveBudgetsForMonth,
  monthKeyToRange,
  sumExpenseInCategoryForRange,
} from "@/db/queries/budgets";
import { fetchAllCategories } from "@/db/queries/categories";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const BUDGET_CHECK_TASK = "BUDGET_CHECK_TASK";

TaskManager.defineTask(BUDGET_CHECK_TASK, async () => {
  try {
    await checkBudgetAndNotify();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBudgetBackgroundFetch(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BUDGET_CHECK_TASK);
    if (registered) return;
    await BackgroundFetch.registerTaskAsync(BUDGET_CHECK_TASK, {
      minimumInterval: 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    /* simulator / denied */
  }
}

export async function unregisterBudgetBackgroundFetch(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BUDGET_CHECK_TASK);
    if (registered) await BackgroundFetch.unregisterTaskAsync(BUDGET_CHECK_TASK);
  } catch {
    /* noop */
  }
}

async function cancelBudgetCategoryNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const r of all) {
    const kind = r.content.data?.hpKind;
    if (kind === "budget_category" || r.identifier.startsWith("hp_budget_alert_")) {
      await Notifications.cancelScheduledNotificationAsync(r.identifier);
    }
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function checkBudgetAndNotify(): Promise<void> {
  if (Platform.OS === "web") return;
  const settings = useSettingsStore.getState().notificationSettings;
  if (!settings.budgetAlerts) return;
  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  const fallbackThreshold = settings.budgetAlertThreshold ?? settings.budgetThresholdPct ?? 80;
  const monthKey = currentBudgetMonthKey();
  const list = fetchActiveBudgetsForMonth(monthKey);
  const cats = fetchAllCategories();
  const catById = new Map(cats.map((c) => [c.id, c.name]));
  const today = format(new Date(), "yyyyMMdd");

  for (const b of list) {
    const { startMs, endMs } = monthKeyToRange(b.month);
    const spent = sumExpenseInCategoryForRange(b.categoryId, startMs, endMs);
    const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    const threshold = b.alertThresholdPct ?? fallbackThreshold;
    if (pct < threshold) continue;
    const storageKey = `budget_notif_${b.id}_${today}`;
    const done = await AsyncStorage.getItem(storageKey);
    if (done) continue;
    const name = catById.get(b.categoryId) ?? "Category";
    await Notifications.scheduleNotificationAsync({
      identifier: `hp_budget_alert_${b.id}_${today}`,
      content: {
        title: `Budget Alert — ${name}`,
        body: `You've used ${Math.round(pct)}% of your ${name} budget (₹${Math.round(spent)} of ₹${Math.round(b.monthlyLimit)})`,
        data: { hpKind: "budget_category" },
      },
      trigger: null,
    });
    await AsyncStorage.setItem(storageKey, "1");
  }
}

export async function scheduleOrCancelBudgetAlerts(settings: NotificationSettings): Promise<void> {
  await cancelBudgetCategoryNotifications();
  if (!settings.budgetAlerts) {
    await unregisterBudgetBackgroundFetch();
    return;
  }
  await ensureNotificationPermissions();
  await checkBudgetAndNotify();
  await registerBudgetBackgroundFetch();
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync("hp_daily_reminder").catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: "hp_daily_reminder",
    content: {
      title: "Hindustan Pay",
      body: "Time to log today's expenses — keep your streak going!",
      data: { hpKind: "daily_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("hp_daily_reminder").catch(() => {});
}

export async function scheduleWeeklySummary(dayOfWeek: number, hour: number, minute: number): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync("hp_weekly_summary").catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: "hp_weekly_summary",
    content: {
      title: "Hindustan Pay",
      body: "Your weekly summary is ready — tap to view insights",
      data: { hpKind: "weekly_summary" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: dayOfWeek,
      hour,
      minute,
    },
  });
}

export async function cancelWeeklySummary(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("hp_weekly_summary").catch(() => {});
}

export async function scheduleStreakReminder(
  goalId: string,
  streakCount: number,
  goalName: string,
): Promise<void> {
  if (Platform.OS === "web") return;
  const id = `hp_streak_${goalId}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const d = new Date();
  d.setHours(20, 0, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: "Hindustan Pay",
      body: `Don't break your ${streakCount}-day streak! Log your activity for ${goalName}.`,
      data: { hpKind: "streak", goalId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: d,
    },
  });
}

export async function sendBudgetAlert(categoryName: string, pct: number): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Budget alert",
      body: `You've used ${pct}% of your ${categoryName} budget this month.`,
      data: { hpKind: "budget_category" },
    },
    trigger: null,
  });
}

export async function scheduleEMIReminder(emi: EMI): Promise<void> {
  if (Platform.OS === "web") return;
  const id = `emi_${emi.id}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  if (!emi.isActive) return;
  const ok = await ensureNotificationPermissions();
  if (!ok) return;
  const triggerAt = emi.nextDueDate - 3 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(triggerAt) || triggerAt <= Date.now()) return;
  const dueLabel = format(new Date(emi.nextDueDate), "dd MMM");
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `${emi.name} EMI Due Soon`,
      body: `₹${Math.round(emi.emiAmount)} due on ${dueLabel}. Don't miss it!`,
      data: { hpKind: "emi_due", emiId: emi.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(triggerAt),
    },
  });
}
