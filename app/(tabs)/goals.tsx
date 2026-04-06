import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGoalStore } from "@/store/useGoalStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { GoalCard } from "@/components/goals/GoalCard";
import { ChallengeCard } from "@/components/goals/ChallengeCard";
import { StreakCalendar } from "@/components/goals/StreakCalendar";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatCurrency";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { useEMIStore } from "@/store/useEMIStore";
import { EMICard } from "@/components/emi/EMICard";
import { EMIDetailSheet, type EMIDetailSheetRef } from "@/components/emi/EMIDetailSheet";
import { currentBudgetMonthKey, deleteBudgetById, fetchActiveBudgetsForMonth, monthKeyToRange } from "@/db/queries/budgets";
import { BudgetCard } from "@/components/goals/BudgetCard";
import { ContributeSheet, type ContributeSheetRef } from "@/components/goals/ContributeSheet";
import { GoalCompletionCelebration } from "@/components/goals/GoalCompletionCelebration";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { scheduleStreakReminder } from "@/utils/notifications";
import type { Goal } from "@/types/goal";
import { useHaptics } from "@/hooks/useHaptics";

const tabs = ["Savings", "Challenges", "No-spend", "Budgets", "EMI"] as const;

function GoalsBody() {
  const router = useRouter();
  const { colors } = useTheme();
  const merged = useMergedCategories();
  const currency = useCurrency();
  const goals = useGoalStore((s) => s.goals);
  const txs = useTransactionStore((s) => s.transactions);
  const { emis, loadEMIs, markEMIPaid } = useEMIStore();
  
  const [tab, setTab] = useState<(typeof tabs)[number]>("Savings");
  const sheetRef = useRef<ContributeSheetRef>(null);
  const emiSheetRef = useRef<EMIDetailSheetRef>(null);
  const [celebrate, setCelebrate] = useState<Goal | null>(null);
  const [budgetTick, setBudgetTick] = useState(0);
  const { light } = useHaptics();

  useFocusEffect(
    useCallback(() => {
      setBudgetTick((x) => x + 1);
      void loadEMIs();
    }, [loadEMIs]),
  );

  const savings = goals.filter((g) => g.type === "savings");
  const challenges = goals.filter((g) => g.type === "challenge");
  const noSpend = goals.filter((g) => g.type === "no-spend");
  const budgets = goals.filter((g) => g.type === "budget");

  const totalSaved = savings.reduce((s, g) => s + g.currentAmount, 0);
  const longest = Math.max(0, ...goals.map((g) => g.streakCount));

  useEffect(() => {
    const g = noSpend.find((x) => !x.isCompleted && x.streakCount > 0);
    if (g) {
      void scheduleStreakReminder(g.id, g.streakCount, g.title);
    }
  }, [noSpend]);

  const disciplineScores = useMemo(() => {
    const m: Record<string, number> = {};
    const byDay = new Map<string, { exp: number; inc: number }>();
    for (const t of txs.filter((x) => !x.isDeleted)) {
      const key = new Date(t.date).toISOString().slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, { exp: 0, inc: 0 });
      const row = byDay.get(key)!;
      if (t.type === "expense") row.exp += t.amount;
      else row.inc += t.amount;
    }
    byDay.forEach((v, key) => {
      const ratio = v.inc > 0 ? v.exp / v.inc : v.exp > 0 ? 1 : 0;
      m[key] = Math.max(0, 1 - Math.min(1, ratio));
    });
    return m;
  }, [txs]);

  const budgetRows = useMemo(() => {
    const dbBudgets = fetchActiveBudgetsForMonth(currentBudgetMonthKey());
    return dbBudgets.map((b) => {
      const c = merged.find((x) => x.id === b.categoryId);
      const { startMs, endMs } = monthKeyToRange(b.month);
      const spent = txs
        .filter(
          (t) =>
            !t.isDeleted &&
            t.type === "expense" &&
            t.categoryId === b.categoryId &&
            t.date >= startMs &&
            t.date <= endMs,
        )
        .reduce((s, t) => s + t.amount, 0);
      return {
        budget: b,
        spent,
        categoryName: c?.name ?? "Category",
        categoryIcon: c?.icon ?? "help-circle-outline",
        categoryColor: c?.color ?? "#8888AA",
      };
    });
  }, [txs, budgetTick, merged]);

  const openContribute = (g: Goal) => {
    light();
    sheetRef.current?.present(g);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flex: 1 }}>
      <ContributeSheet
        ref={sheetRef}
        currency={currency}
        onGoalCompleted={(g) => setCelebrate(g)}
      />
      <GoalCompletionCelebration
        visible={celebrate != null}
        goal={celebrate}
        currency={currency}
        onClose={() => setCelebrate(null)}
      />
      <EMIDetailSheet
        ref={emiSheetRef}
        onMarkPaid={(e) => markEMIPaid(e.id)}
        onEdit={(e) => router.push(`/modals/add-emi?id=${e.id}` as any)}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, marginTop: 8 }}>Goals</Text>
        <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
          <View style={{ flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Active goals</Text>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 20, marginTop: 6 }}>
              {goals.filter((g) => !g.isCompleted).length} / {goals.length}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Longest streak</Text>
            <Text style={{ color: colors.primary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 20, marginTop: 6 }}>{longest} days</Text>
          </View>
        </View>
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Total saved across goals: {formatCurrency(totalSaved, currency)}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }} contentContainerStyle={{ gap: 8 }}>
          {tabs.map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                light();
                setTab(t);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: tab === t ? "rgba(108,99,255,0.3)" : colors.surfaceElevated,
                borderWidth: 1,
                borderColor: tab === t ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium" }}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === "Savings" ? (
          <View style={{ marginTop: 16 }}>
            {savings.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <LottieView source={require("../../assets/lottie/empty-wallet.json")} autoPlay loop style={{ width: 180, height: 180 }} />
                <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, marginTop: 8, textAlign: "center" }}>
                  Set your first savings goal
                </Text>
                <View style={{ marginTop: 20, width: "100%" }}>
                  <Button title="Add savings goal" onPress={() => router.push("/modals/add-goal" as never)} />
                </View>
              </View>
            ) : (
              <>
                {savings.map((g) => (
                  <GoalCard key={g.id} goal={g} currency={currency} onContribute={() => openContribute(g)} />
                ))}
                <Button title="New savings goal" onPress={() => router.push("/modals/add-goal" as never)} />
              </>
            )}
          </View>
        ) : null}

        {tab === "Challenges" ? (
          <View style={{ marginTop: 16, gap: 12 }}>
            {challenges.length ? (
              challenges.map((g) => <ChallengeCard key={g.id} goal={g} />)
            ) : (
              <Text style={{ color: colors.textSecondary }}>Create a challenge from the + menu.</Text>
            )}
          </View>
        ) : null}

        {tab === "No-spend" ? (
          <View style={{ marginTop: 16, gap: 12 }}>
            {noSpend.length ? (
              noSpend.map((g) => <ChallengeCard key={g.id} goal={g} />)
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={{ color: colors.textSecondary }}>Start a no-spend challenge to build discipline.</Text>
                <Button title="Add challenge" onPress={() => router.push("/modals/add-goal?type=no-spend" as never)} />
              </View>
            )}
          </View>
        ) : null}

        {tab === "Budgets" ? (
          <View style={{ marginTop: 16 }}>
            {budgetRows.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 17, textAlign: "center" }}>
                  Set budget limits to track your spending
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 8 }}>
                  Create a monthly cap per category and get alerts as you approach it.
                </Text>
                <View style={{ marginTop: 20, width: "100%" }}>
                  <Button title="Add budget" onPress={() => router.push("/modals/add-budget" as never)} />
                </View>
              </View>
            ) : (
              budgetRows.map((row) => (
                <BudgetCard
                  key={row.budget.id}
                  budget={row.budget}
                  spent={row.spent}
                  categoryName={row.categoryName}
                  categoryIcon={row.categoryIcon}
                  categoryColor={row.categoryColor}
                  currency={currency}
                  onEdit={() => router.push(`/modals/add-budget?id=${row.budget.id}` as never)}
                  onDelete={() => {
                    Alert.alert("Delete budget", "Remove this budget?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          deleteBudgetById(row.budget.id);
                          setBudgetTick((x) => x + 1);
                        },
                      },
                    ]);
                  }}
                />
              ))
            )}
          </View>
        ) : null}

        {tab === "EMI" ? (
          <View style={{ marginTop: 16 }}>
            {emis.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 12 }}>
                <MaterialCommunityIcons name="calendar-clock" size={64} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
                <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, textAlign: "center" }}>
                  Track your EMIs & Loans
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 8 }}>
                  Get reminders before due dates and see your total debt reducing.
                </Text>
                <View style={{ marginTop: 24, width: "100%" }}>
                  <Button title="Add your first EMI" onPress={() => router.push("/modals/add-emi" as any)} />
                </View>
              </View>
            ) : (
              <>
                {emis.map((item) => (
                  <EMICard
                    key={item.id}
                    emi={item}
                    onPress={(e) => emiSheetRef.current?.present(e)}
                    onMarkPaid={() => markEMIPaid(item.id)}
                  />
                ))}
                <Button variant="ghost" title="Add another EMI" onPress={() => router.push("/modals/add-emi" as any)} />
              </>
            )}
          </View>
        ) : null}

        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 28 }}>Discipline heatmap</Text>
        <StreakCalendar scores={disciplineScores} />
      </ScrollView>
      
      {tab === "Budgets" ? (
        <Pressable
          onPress={() => {
            light();
            router.push("/modals/add-budget" as never);
          }}
          style={{ position: "absolute", right: 20, bottom: 28 }}
          accessibilityLabel="Add budget"
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOpacity: 0.4,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }}
          >
            <MaterialCommunityIcons name="wallet-plus" size={26} color="#fff" />
          </LinearGradient>
        </Pressable>
      ) : null}

      {tab === "EMI" ? (
        <Pressable
          onPress={() => {
            light();
            router.push("/modals/add-emi" as any);
          }}
          style={{ position: "absolute", right: 20, bottom: 28 }}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <MaterialCommunityIcons name="plus" size={30} color="#fff" />
          </LinearGradient>
        </Pressable>
      ) : null}
      </View>
    </SafeAreaView>
  );
}

export default function GoalsScreen() {
  return (
    <ErrorBoundary label="Goals">
      <GoalsBody />
    </ErrorBoundary>
  );
}
