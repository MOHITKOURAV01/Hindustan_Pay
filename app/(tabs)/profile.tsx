import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { DateTimePickerModal } from "@/components/ui/DateTimePickerModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore, type NotificationSettings } from "@/store/useSettingsStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { ACCENT_OPTIONS } from "@/constants/theme";
import { CURRENCIES, type CurrencyCode } from "@/constants/currencies";
import {
  ensureNotificationPermissions,
  scheduleOrCancelBudgetAlerts,
  scheduleDailyReminder,
  scheduleWeeklySummary,
  cancelDailyReminder,
  cancelWeeklySummary,
} from "@/utils/notifications";
import { formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@/components/ui/Button";
import { importTransactionsFromCSV } from "@/utils/csvImport";
import { buildSampleCSV, exportSummaryPDF, exportTransactionsToCSV } from "@/utils/csvExport";
import { useToastStore } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Analytics } from "@/utils/analytics";
import { resetDatabase } from "@/db/init";
import { seedDatabaseIfEmpty } from "@/db/seed";
import { useCategoryStore } from "@/store/useCategoryStore";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", fontSize: 12 }}>{title}</Text>
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>{children}</View>
    </View>
  );
}

function Row({ label, right }: { label: string; right: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.textPrimary, fontFamily: "Inter_400Regular" }}>{label}</Text>
      {right}
    </View>
  );
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function lockLabel(preset: "immediate" | "1m" | "5m" | "15m"): string {
  switch (preset) {
    case "immediate": return "Immediate";
    case "1m": return "After 1 min";
    case "5m": return "After 5 min";
    case "15m": return "After 15 min";
    default: return preset;
  }
}

function ProfileBody() {
  const router = useRouter();
  const { colors } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const profile = useAuthStore((s) => s.userProfile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const txs = useTransactionStore((s) => s.transactions);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const accent = useSettingsStore((s) => s.accentColor);
  const setAccent = useSettingsStore((s) => s.setAccentColor);
  const bio = useSettingsStore((s) => s.biometricEnabled);
  const setBio = useSettingsStore((s) => s.setBiometricEnabled);
  const notif = useSettingsStore((s) => s.notificationSettings);
  const setNotif = useSettingsStore((s) => s.setNotificationSettings);
  const defaultTxType = useSettingsStore((s) => s.defaultTransactionType);
  const setDefaultTxType = useSettingsStore((s) => s.setDefaultTransactionType);
  const appLockTimeout = useSettingsStore((s) => s.appLockTimeout);
  const setAppLockTimeout = useSettingsStore((s) => s.setAppLockTimeout);
  const fontSizePreset = useSettingsStore((s) => s.fontSizePreset);
  const setFontSizePreset = useSettingsStore((s) => s.setFontSizePreset);
  const edition = useSettingsStore((s) => s.edition);
  const setEdition = useSettingsStore((s) => s.setEdition);
  const language = useSettingsStore((s) => s.language);
  const firstDayOfWeek = useSettingsStore((s) => s.firstDayOfWeek);
  const setFirstDayOfWeek = useSettingsStore((s) => s.setFirstDayOfWeek);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const [picker, setPicker] = useState<null | "currency">(null);
  const [importing, setImporting] = useState(false);
  const [showDailyPicker, setShowDailyPicker] = useState(false);

  const netWorth = txs.filter((t) => !t.isDeleted).reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  const applyNotif = useCallback(
    async (p: Partial<NotificationSettings>) => {
      setNotif(p);
      const next = useSettingsStore.getState().notificationSettings;
      if (p.budgetAlerts !== undefined || p.budgetThresholdPct !== undefined || p.budgetAlertThreshold !== undefined) {
        await scheduleOrCancelBudgetAlerts({
          ...next,
          budgetAlertThreshold: next.budgetAlertThreshold ?? next.budgetThresholdPct,
        });
      }
      if (next.dailyReminder) {
        const ok = await ensureNotificationPermissions();
        if (ok) await scheduleDailyReminder(next.dailyReminderHour, next.dailyReminderMinute);
      } else if (p.dailyReminder === false) {
        await cancelDailyReminder();
      }
      if (next.weeklySummary) {
        const ok = await ensureNotificationPermissions();
        if (ok) {
          await scheduleWeeklySummary(
            next.weeklySummaryWeekday ?? 2,
            next.weeklySummaryHour ?? 9,
            next.weeklySummaryMinute ?? 0,
          );
        }
      } else if (p.weeklySummary === false) {
        await cancelWeeklySummary();
      }
    },
    [setNotif],
  );

  const dailyDate = useMemo(() => {
    const d = new Date();
    d.setHours(notif.dailyReminderHour, notif.dailyReminderMinute, 0, 0);
    return d;
  }, [notif.dailyReminderHour, notif.dailyReminderMinute]);

  const thresholdOptions = [50, 70, 80, 90] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 24 }}>Profile</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20, gap: 16 }}>
          <Pressable onPress={() => updateProfile({ avatarColor: ((profile.avatarColor ?? 0) + 40) % 360 })}>
            <Avatar name={profile.name} hue={profile.avatarColor} />
          </Pressable>
          <View>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 20 }}>{profile.name}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Member since {profile.memberSince}</Text>
          </View>
        </View>
        <View style={{ marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textSecondary }}>Net worth (demo)</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, marginTop: 6 }}>{formatCurrency(netWorth, currency)}</Text>
        </View>

        <Section title="Preferences">
          <Row label="Currency" right={
            <Pressable onPress={() => setPicker(picker === "currency" ? null : "currency")}>
              <Text style={{ color: colors.primary }}>{currency}</Text>
            </Pressable>
          } />
          {picker === "currency" && (
            <View style={{ padding: 12, gap: 8 }}>
              {CURRENCIES.map((c) => (
                <Pressable key={c.code} onPress={() => { setCurrency(c.code as CurrencyCode); setPicker(null); }}>
                  <Text style={{ color: colors.textPrimary }}>{c.label} ({c.code})</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Row label="Default type" right={
            <Pressable onPress={() => setDefaultTxType(defaultTxType === "expense" ? "income" : "expense")}>
              <Text style={{ color: colors.primary, textTransform: "capitalize" }}>{defaultTxType}</Text>
            </Pressable>
          } />
          <Row label="Manage categories" right={
            <Pressable onPress={() => router.push("/modals/manage-categories" as never)}>
              <Text style={{ color: colors.primary }}>Open</Text>
            </Pressable>
          } />
          <Row label="First day of week" right={
            <Pressable onPress={() => setFirstDayOfWeek(firstDayOfWeek === 0 ? 1 : 0)}>
              <Text style={{ color: colors.primary }}>{firstDayOfWeek === 0 ? "Sunday" : "Monday"}</Text>
            </Pressable>
          } />
        </Section>

        <Section title="Security">
          <Row label="Biometric lock" right={<Switch value={bio} onValueChange={setBio} />} />
          <Row label="App lock timeout" right={
            <Pressable onPress={() => {
              const order: ("immediate" | "1m" | "5m" | "15m")[] = ["immediate", "1m", "5m", "15m"];
              const i = order.indexOf(appLockTimeout);
              setAppLockTimeout(order[(i + 1) % order.length]);
            }}>
              <Text style={{ color: colors.primary }}>{lockLabel(appLockTimeout)}</Text>
            </Pressable>
          } />
          <Row label="Change PIN" right={
            <Pressable onPress={() => router.push("/(auth)/pin-setup" as never)}>
              <Text style={{ color: colors.primary }}>Change</Text>
            </Pressable>
          } />
        </Section>

        <Section title="Appearance">
          <Row label="Theme" right={
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["dark", "light", "system"] as const).map((t) => (
                <Pressable key={t} onPress={() => {
                  setTheme(t);
                  setEdition("standard");
                  Analytics.track("theme_changed", { theme: t, resetEdition: true });
                }}>
                  <Text style={{ color: theme === t ? colors.primary : colors.textSecondary, textTransform: "capitalize" }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          } />
          
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>App Edition</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(["standard", "india", "diwali", "holi"] as const).map((e) => (
                <Pressable
                  key={e}
                  onPress={() => {
                    setEdition(e);
                    Analytics.track("edition_changed", { edition: e });
                    showToast({
                      variant: "success",
                      message: `${e.charAt(0).toUpperCase() + e.slice(1)} Edition active`,
                    });
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: edition === e ? colors.primary : colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: edition === e ? "#fff" : colors.textPrimary, textTransform: "capitalize", fontSize: 13 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Language</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {([["en", "English"], ["hi", "हिन्दी"]] as const).map(([code, label]) => (
                <Pressable
                  key={code}
                  onPress={() => {
                    setLanguage(code);
                    Analytics.track("language_changed", { language: code });
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: language === code ? colors.primary : colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: language === code ? "#fff" : colors.textPrimary, fontSize: 13 }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Font size</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["small", "medium", "large"] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setFontSizePreset(p)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: fontSizePreset === p ? colors.primary : colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: fontSizePreset === p ? "#fff" : colors.textPrimary, textTransform: "capitalize", fontSize: 13 }}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ padding: 16, gap: 10 }}>
            <Text style={{ color: colors.textSecondary }}>Accent</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {ACCENT_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setAccent(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: c,
                    borderWidth: accent === c ? 3 : 0,
                    borderColor: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {accent === c ? <MaterialCommunityIcons name="check" size={18} color="#fff" /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        </Section>

        <Section title="Notifications">
          <Row label="Budget alerts" right={<Switch value={notif.budgetAlerts} onValueChange={(v) => void applyNotif({ budgetAlerts: v })} />} />
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Alert threshold</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {thresholdOptions.map((pct) => (
                <Pressable
                  key={pct}
                  onPress={() => void applyNotif({ budgetThresholdPct: pct, budgetAlertThreshold: pct })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: (notif.budgetThresholdPct ?? 80) === pct ? `${colors.primary}40` : colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.textPrimary }}>{pct}%</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Row label="Daily reminder" right={<Switch value={notif.dailyReminder} onValueChange={(v) => void applyNotif({ dailyReminder: v })} />} />
          {notif.dailyReminder && (
            <Pressable style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => setShowDailyPicker(true)}>
              <Text style={{ color: colors.textSecondary }}>Time</Text>
              <Text style={{ color: colors.primary, marginTop: 4 }}>
                {String(notif.dailyReminderHour).padStart(2, "0")}:{String(notif.dailyReminderMinute).padStart(2, "0")}
              </Text>
            </Pressable>
          )}
          <DateTimePickerModal
            isVisible={showDailyPicker}
            mode="time"
            value={dailyDate}
            title="Daily reminder time"
            onCancel={() => setShowDailyPicker(false)}
            onConfirm={(d) => {
              setShowDailyPicker(false);
              void applyNotif({ dailyReminderHour: d.getHours(), dailyReminderMinute: d.getMinutes() });
            }}
          />
          <Row label="Weekly summary" right={<Switch value={notif.weeklySummary} onValueChange={(v) => void applyNotif({ weeklySummary: v })} />} />
          {notif.weeklySummary && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Day</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {WEEKDAY_LABELS.map((label, idx) => {
                  const expoDow = idx + 1;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => void applyNotif({ weeklySummaryWeekday: expoDow })}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: (notif.weeklySummaryWeekday ?? 2) === expoDow ? `${colors.primary}40` : colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </Section>

        <Section title="Data">
          <Row label="Import CSV" right={
            importing ? <ActivityIndicator color={colors.primary} /> : (
              <Pressable onPress={async () => {
                Analytics.track("export_data", { format: "csv_import_attempt" });
                const res = await DocumentPicker.getDocumentAsync({ type: "text/csv", copyToCacheDirectory: true });
                if (res.canceled || !res.assets?.[0]?.uri) return;
                setImporting(true);
                try {
                  const r = await importTransactionsFromCSV(res.assets[0].uri);
                  loadTransactions();
                  showToast({ variant: r.failed ? "warning" : "success", message: `Imported ${r.success} transactions${r.failed ? ` (${r.failed} failed)` : ""}` });
                } catch (e) {
                  showToast({ variant: "error", message: e instanceof Error ? e.message : "Import failed" });
                } finally { setImporting(false); }
              }}>
                <Text style={{ color: colors.primary }}>Choose file</Text>
              </Pressable>
            )
          } />
          <Row label="Export CSV" right={
            <Pressable onPress={async () => {
              Analytics.track("export_data", { format: "csv" });
              try {
                const path = await exportTransactionsToCSV();
                await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Export CSV" });
              } catch (e) { showToast({ variant: "error", message: e instanceof Error ? e.message : "Export failed" }); }
            }}>
              <Text style={{ color: colors.primary }}>Share</Text>
            </Pressable>
          } />
          <Row label="Export PDF summary" right={
            <Pressable onPress={async () => {
              Analytics.track("export_data", { format: "pdf" });
              try {
                const path = await exportSummaryPDF();
                await Sharing.shareAsync(path, { mimeType: "application/pdf", dialogTitle: "Export PDF" });
              } catch (e) { showToast({ variant: "error", message: e instanceof Error ? e.message : "Export failed" }); }
            }}>
              <Text style={{ color: colors.primary }}>Share</Text>
            </Pressable>
          } />
          <Row label="Clear all data" right={
            <Pressable onPress={() => Alert.alert("Clear data", "This will delete all transactions, goals and EMIs. Demo data will be re-seeded.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => {
                resetDatabase();
                seedDatabaseIfEmpty();
                useCategoryStore.getState().loadCategories();
                loadTransactions();
                showToast({ variant: "success", message: "All data cleared" });
              }},
            ])}>
              <Text style={{ color: "#FF5C5C" }}>Clear</Text>
            </Pressable>
          } />
        </Section>

        <Section title="About">
          <Row label="Version" right={<Text style={{ color: colors.textSecondary }}>1.0.0</Text>} />
          <Row label="Privacy" right={<Text style={{ color: colors.primary }}>Link</Text>} />
        </Section>

        {__DEV__ && (
          <Section title="Developer Tools">
            <Row label="Re-seed database" right={
              <Pressable onPress={() => {
                seedDatabaseIfEmpty();
                loadTransactions();
                showToast({ variant: "success", message: "Database re-seeded" });
              }}>
                <Text style={{ color: colors.primary }}>Seed</Text>
              </Pressable>
            } />
            <Row label="Log store state" right={
              <Pressable onPress={() => {
                console.log("[Dev] Settings:", useSettingsStore.getState());
                console.log("[Dev] Auth:", useAuthStore.getState());
                showToast({ variant: "info", message: "Logged to console" });
              }}>
                <Text style={{ color: colors.primary }}>Print</Text>
              </Pressable>
            } />
          </Section>
        )}

        <View style={{ marginTop: 24 }}>
          <Button variant="ghost" title="Log out (lock)" onPress={() => { useAuthStore.getState().lock(); router.replace("/"); }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ProfileScreen() {
  return (
    <ErrorBoundary label="Profile">
      <ProfileBody />
    </ErrorBoundary>
  );
}
