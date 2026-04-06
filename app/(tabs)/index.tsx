import { Suspense, useCallback, useMemo, useState, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { useInsights } from "@/hooks/useInsights";
import { useInsightStore } from "@/store/useInsightStore";
import { useEMIStore } from "@/store/useEMIStore";
import { processRecurringTransactions } from "@/utils/recurringTransactions";
import { useToastStore } from "@/components/ui/Toast";
import { FinanceGlobe } from "@/components/three/FinanceGlobe";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { WeeklyBarChart, type WeekDayDatum } from "@/components/charts/WeeklyBarChart";
import { currentBudgetMonthKey, fetchActiveBudgetsForMonth, monthKeyToRange } from "@/db/queries/budgets";
import { ParticleField } from "@/components/three/ParticleField";
import { BalanceCard } from "@/components/home/BalanceCard";
import { QuickActions } from "@/components/home/QuickActions";
import { NetWorthCard } from "@/components/home/NetWorthCard";
import { RecentTransactions } from "@/components/home/RecentTransactions";
import { UpcomingWidget } from "@/components/home/UpcomingWidget";
import { SavingsRing } from "@/components/home/SavingsRing";
import { SpendingPulse } from "@/components/home/SpendingPulse";
import { MonthlyBudgetCard } from "@/components/home/MonthlyBudgetCard";
import { HealthScoreCard } from "@/components/home/HealthScoreCard";
import { HealthScoreDetailSheet, type HealthScoreDetailSheetRef } from "@/components/home/HealthScoreDetailSheet";
import { useHealthScoreStore } from "@/store/useHealthScoreStore";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useHaptics } from "@/hooks/useHaptics";
import { Analytics } from "@/utils/analytics";
import { useStrings } from "@/hooks/useStrings";

function HomeBody() {
  const router = useRouter();
  const { colors } = useTheme();
  const currency = useCurrency();
  const { t } = useStrings();
  const profile = useAuthStore((s) => s.userProfile);
  const txs = useTransactionStore((s) => s.transactions);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const { emis, loadEMIs } = useEMIStore();
  const { score, history, refreshScore } = useHealthScoreStore();
  const { insights } = useInsights();
  const calculateInsights = useInsightStore((s) => s.calculateInsights);
  const showToast = useToastStore((s) => s.show);
  const [weekMode, setWeekMode] = useState<"this" | "last">("this");
  const [refreshing, setRefreshing] = useState(false);
  const { light } = useHaptics();
  const merged = useMergedCategories();

  const healthSheetRef = useRef<HealthScoreDetailSheetRef>(null);

  const getGreeting = useCallback(() => {
    const h = new Date().getHours();
    if (h < 12) return t("greeting_morning");
    if (h < 17) return t("greeting_afternoon");
    return t("greeting_evening");
  }, [t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      loadTransactions();
      void loadEMIs();
      void refreshScore();
      const n = processRecurringTransactions();
      if (n > 0) loadTransactions();
      await calculateInsights();
      showToast({ variant: "success", message: "Updated just now" });
    } finally {
      setRefreshing(false);
    }
  }, [loadTransactions, calculateInsights, showToast, loadEMIs, refreshScore]);

  useFocusEffect(
    useCallback(() => {
      void refreshScore();
    }, [refreshScore]),
  );

  const now = Date.now();
  const monthStart = startOfMonth(now).getTime();
  const monthEnd = endOfMonth(now).getTime();
  const active = txs.filter((t) => !t.isDeleted && !t.isArchived);

  const { balance, incomeMonth, expenseMonth, delta } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of active) {
      if (t.date < monthStart || t.date > monthEnd) continue;
      if (t.type === "income") inc += t.amount;
      else exp += t.amount;
    }
    const totalIncome = active.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExp = active.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return {
      balance: totalIncome - totalExp,
      incomeMonth: inc,
      expenseMonth: exp,
      delta: inc - exp,
    };
  }, [active, monthStart, monthEnd]);

  const weekData: WeekDayDatum[] = useMemo(() => {
    const offset = weekMode === "this" ? 0 : 7;
    const days: WeekDayDatum[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = subDays(now, i + offset).setHours(0, 0, 0, 0);
      const dayEnd = subDays(now, i + offset).setHours(23, 59, 59, 999);
      let inc = 0;
      let exp = 0;
      for (const t of active) {
        if (t.date >= dayStart && t.date <= dayEnd) {
          if (t.type === "income") inc += t.amount;
          else exp += t.amount;
        }
      }
      days.push({
        day: format(dayStart, "EEE"),
        income: inc,
        expense: exp,
      });
    }
    return days;
  }, [active, now, weekMode]);

  const donutData = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of active) {
      if (t.type !== "expense") continue;
      if (t.date < monthStart || t.date > monthEnd) continue;
      const id = t.categoryId ?? "x";
      m.set(id, (m.get(id) ?? 0) + t.amount);
    }
    return [...m.entries()].map(([id, value]) => {
      const c = merged.find((x: any) => x.id === id);
      return { label: c?.name ?? "Other", value, color: c?.color ?? "#8888AA" };
    });
  }, [active, monthStart, monthEnd, merged]);

  const todayExp = active
    .filter((t) => t.type === "expense" && t.date >= subDays(now, 0).setHours(0, 0, 0, 0))
    .reduce((s, t) => s + t.amount, 0);

  const todayCats = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of active) {
      if (t.type !== "expense") continue;
      if (t.date < subDays(now, 0).setHours(0, 0, 0, 0)) continue;
      const n = merged.find((c: any) => c.id === t.categoryId)?.name ?? "Other";
      m.set(n, (m.get(n) ?? 0) + t.amount);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label]) => ({ label }));
  }, [active, now, merged]);

  const savingsRate = incomeMonth > 0 ? (incomeMonth - expenseMonth) / incomeMonth : 0;
  const goalSaved = Math.max(0, incomeMonth - expenseMonth);
  const goalTarget = Math.max(goalSaved, incomeMonth * 0.25 || 8000);

  const recent = [...active].sort((a, b) => b.date - a.date).slice(0, 5);

  const nudge = insights[0];

  const { incomeMax, expenseMax } = useMemo(() => {
    let im = 0;
    let em = 0;
    for (const t of active) {
      if (t.date < monthStart || t.date > monthEnd) continue;
      if (t.type === "income") im = Math.max(im, t.amount);
      else em = Math.max(em, t.amount);
    }
    return { incomeMax: im || 1, expenseMax: em || 1 };
  }, [active, monthStart, monthEnd]);

  const incomeNorm = Math.min(2.5, incomeMax / 15000);
  const expenseNorm = Math.min(2.5, expenseMax / 8000);

  const budgetSummaries = useMemo(() => {
    const list = fetchActiveBudgetsForMonth(currentBudgetMonthKey());
    return list.map((b) => {
      const c = merged.find((xc: any) => xc.id === b.categoryId);
      const { startMs, endMs } = monthKeyToRange(b.month);
      const spent = active
        .filter(
          (t) =>
            t.type === "expense" &&
            t.categoryId === b.categoryId &&
            t.date >= startMs &&
            t.date <= endMs,
        )
        .reduce((acc, t) => acc + t.amount, 0);
      return {
        id: b.id,
        name: c?.name ?? "Other",
        spent,
        limit: b.monthlyLimit,
        color: c?.color ?? "#8888AA",
        icon: c?.icon ?? "help-circle-outline",
      };
    }).sort((a, b) => (b.spent / b.limit || 0) - (a.spent / a.limit || 0));
  }, [active, merged]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ParticleField />
      <LinearGradient colors={[`${colors.primary}26`, "transparent"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 200 }} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular" }}>
                {getGreeting()}, {profile.name}
              </Text>
              <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, marginTop: 4 }}>Hindustan Pay</Text>
            </View>
            <Pressable accessibilityLabel="Notifications" style={{ marginRight: 12 }}>
              <View>
                <MaterialCommunityIcons name="bell-outline" size={26} color={colors.textPrimary} />
                <View style={{ position: "absolute", top: -4, right: -8 }}>
                  <Badge count={3} />
                </View>
              </View>
            </Pressable>
            <Avatar name={profile.name} hue={profile.avatarColor} />
          </View>

          <View style={{ alignItems: "center", marginTop: 16 }}>
            <Suspense
              fallback={
                <View style={{ width: 200, height: 200, justifyContent: "center" }}>
                   <Skeleton height={180} width={180} />
                </View>
              }
            >
              <FinanceGlobe
                key={`globe-${Math.round(incomeMax)}-${Math.round(expenseMax)}`}
                size={200}
                incomeScale={incomeNorm}
                expenseScale={expenseNorm}
                fallback={<SpendingDonut data={donutData.slice(0, 5)} size={200} />}
              />
            </Suspense>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <BalanceCard balance={balance} delta={delta} incomeMonth={incomeMonth} expenseMonth={expenseMonth} currency={currency} />
          </View>

          {score && (
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <HealthScoreCard
                score={score.score}
                grade={score.grade}
                label={score.label}
                color={score.color}
                onPress={() => {
                  Analytics.track("health_score_checked", { score: score.score });
                  healthSheetRef.current?.present(score, history);
                }}
              />
            </View>
          )}

          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <NetWorthCard transactions={txs} currency={currency} emis={emis} />
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16, marginBottom: 12 }}>Quick actions</Text>
            <QuickActions />
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 24, alignItems: "center" }}>
            <SavingsRing rate={savingsRate} saved={goalSaved} target={goalTarget} currency={currency} />
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <SpendingPulse todayTotal={todayExp} chips={todayCats.length ? todayCats : [{ label: "No spend today" }]} currency={currency} />
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16 }}>Weekly cash flow</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => {
                    light();
                    setWeekMode("this");
                  }}
                >
                  <Text style={{ color: weekMode === "this" ? colors.primary : colors.textSecondary }}>This week</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    light();
                    setWeekMode("last");
                  }}
                >
                  <Text style={{ color: weekMode === "last" ? colors.primary : colors.textSecondary }}>Last week</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ height: 220, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
              <WeeklyBarChart data={weekData} height={220} />
            </View>
          </View>

          {budgetSummaries.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <MonthlyBudgetCard budgets={budgetSummaries} currency={currency} />
            </View>
          )}

          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <UpcomingWidget currency={currency} />
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16, marginBottom: 8 }}>Recent</Text>
            <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, backgroundColor: colors.surface }}>
              <RecentTransactions items={recent} currency={currency} />
            </View>
          </View>

          {nudge ? (
            <Pressable
              onPress={() => router.push("/(tabs)/insights" as never)}
              style={{
                marginHorizontal: 20,
                marginTop: 20,
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.surfaceElevated,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Insight</Text>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", marginTop: 6 }}>{nudge.body}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <HealthScoreDetailSheet ref={healthSheetRef} />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ErrorBoundary label="Home">
      <HomeBody />
    </ErrorBoundary>
  );
}
