import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CurrencyCode } from "@/constants/currencies";
import type { FontScalePreset } from "@/constants/theme";

export type NotificationSettings = {
  budgetAlerts: boolean;
  budgetThresholdPct: number;
  /** Alias for budgetThresholdPct — budget alert threshold (default 80). */
  budgetAlertThreshold: number;
  dailyReminder: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  weeklySummary: boolean;
  /** Expo weekly trigger: 1 = Sunday … 7 = Saturday */
  weeklySummaryWeekday: number;
  weeklySummaryHour: number;
  weeklySummaryMinute: number;
};

type SettingsState = {
  theme: "dark" | "light" | "system";
  currency: CurrencyCode;
  accentColor: string;
  fontSizePreset: FontScalePreset;
  biometricEnabled: boolean;
  appLockTimeout: "immediate" | "1m" | "5m" | "15m";
  defaultTransactionType: "income" | "expense";
  firstDayOfWeek: 0 | 1;
  edition: "standard" | "india" | "diwali" | "holi";
  language: "en" | "hi";
  userName: string;
  firstName: string;
  notificationSettings: NotificationSettings;
  setTheme: (t: SettingsState["theme"]) => void;
  setCurrency: (c: CurrencyCode) => void;
  setAccentColor: (c: string) => void;
  setFontSizePreset: (p: FontScalePreset) => void;
  setBiometricEnabled: (v: boolean) => void;
  setAppLockTimeout: (t: SettingsState["appLockTimeout"]) => void;
  setDefaultTransactionType: (t: "income" | "expense") => void;
  setFirstDayOfWeek: (d: 0 | 1) => void;
  setEdition: (e: SettingsState["edition"]) => void;
  setLanguage: (l: SettingsState["language"]) => void;
  setUserName: (n: string) => void;
  setFirstName: (n: string) => void;
  setNotificationSettings: (p: Partial<NotificationSettings>) => void;
};

const defaultNotifications: NotificationSettings = {
  budgetAlerts: true,
  budgetThresholdPct: 80,
  budgetAlertThreshold: 80,
  dailyReminder: false,
  dailyReminderHour: 20,
  dailyReminderMinute: 0,
  weeklySummary: true,
  weeklySummaryWeekday: 2,
  weeklySummaryHour: 9,
  weeklySummaryMinute: 0,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      currency: "INR",
      accentColor: "#FF6B00",
      fontSizePreset: "medium",
      biometricEnabled: false,
      appLockTimeout: "5m",
      defaultTransactionType: "expense",
      firstDayOfWeek: 1,
      edition: "india",
      language: "en",
      userName: "Mohit Kourav",
      firstName: "Mohit",
      notificationSettings: defaultNotifications,
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setFontSizePreset: (fontSizePreset) => set({ fontSizePreset }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setAppLockTimeout: (appLockTimeout) => set({ appLockTimeout }),
      setDefaultTransactionType: (defaultTransactionType) =>
        set({ defaultTransactionType }),
      setFirstDayOfWeek: (firstDayOfWeek) => set({ firstDayOfWeek }),
      setEdition: (edition) => set({ edition }),
      setLanguage: (language) => set({ language }),
      setUserName: (userName) => set({ userName }),
      setFirstName: (firstName) => set({ firstName }),
      setNotificationSettings: (p) =>
        set((s) => {
          const next = { ...s.notificationSettings, ...p };
          if (p.budgetThresholdPct != null) next.budgetAlertThreshold = p.budgetThresholdPct;
          if (p.budgetAlertThreshold != null) next.budgetThresholdPct = p.budgetAlertThreshold;
          return { notificationSettings: next };
        }),
    }),
    {
      name: "hp-settings",
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined;
        if (!p) return current;
        const n = (p.notificationSettings ?? {}) as Partial<NotificationSettings>;
        return {
          ...current,
          ...p,
          fontSizePreset: p.fontSizePreset ?? current.fontSizePreset,
          notificationSettings: {
            ...defaultNotifications,
            ...n,
            budgetThresholdPct: n.budgetThresholdPct ?? n.budgetAlertThreshold ?? defaultNotifications.budgetThresholdPct,
            budgetAlertThreshold: n.budgetAlertThreshold ?? n.budgetThresholdPct ?? defaultNotifications.budgetAlertThreshold,
            weeklySummaryWeekday: n.weeklySummaryWeekday ?? defaultNotifications.weeklySummaryWeekday,
            weeklySummaryHour: n.weeklySummaryHour ?? defaultNotifications.weeklySummaryHour,
            weeklySummaryMinute: n.weeklySummaryMinute ?? defaultNotifications.weeklySummaryMinute,
          },
        };
      },
    },
  ),
);
