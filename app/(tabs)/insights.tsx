import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useInsights } from "@/hooks/useInsights";
import { useInsightStore } from "@/store/useInsightStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { CategoryRanking } from "@/components/insights/CategoryRanking";
import { InsightCard } from "@/components/insights/InsightCard";
import { ComparisonBanner } from "@/components/insights/ComparisonBanner";
import { CategoryDetailModal } from "@/components/insights/CategoryDetailModal";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { formatCurrency } from "@/utils/formatCurrency";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { useRouter } from "expo-router";
import { useEMIStore } from "@/store/useEMIStore";
import { useGoalStore } from "@/store/useGoalStore";
import { getSavingsSuggestions } from "@/utils/savingsSuggestions";
import { SavingsSuggestions } from "@/components/insights/SavingsSuggestions";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useToastStore } from "@/components/ui/Toast";

function InsightsBody() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currency = useCurrency();
  const merged = useMergedCategories();
  const txs = useTransactionStore((s) => s.transactions);
  const emis = useEMIStore((s) => s.emis);
  const goals = useGoalStore((s) => s.goals);
  const { insights } = useInsights();
  const dismissInsight = useInsightStore((s) => s.dismissInsight);
  const showToast = useToastStore((s) => s.show);
  const [vsLast, setVsLast] = useState(true);
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const d = new Date();
    return d.getFullYear() * 100 + (d.getMonth() + 1);
  });
  const [detailCategoryId, setDetailCategoryId] = useState<string | null>(null);
  const [heatmapTip, setHeatmapTip] = useState<null | { dow: number; hour: number; count: number; total: number }>(null);
  const chartFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    chartFade.setValue(0);
    Animated.timing(chartFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [selectedMonthKey, chartFade]);

  const selY = Math.floor(selectedMonthKey / 100);
  const selM = selectedMonthKey % 100;
  const mStart = new Date(selY, selM - 1, 1).getTime();
  const mEnd = new Date(selY, selM, 0, 23, 59, 59, 999).getTime();
  const prevAnchor = subMonths(new Date(selY, selM - 1, 1), 1);
  const prevStart = startOfMonth(prevAnchor).getTime();
  const prevEnd = endOfMonth(prevAnchor).getTime();
  const now = Date.now();

  const active = txs.filter((t) => !t.isDeleted && !t.isArchived);
  const locked = active.length < 5;
  const need = Math.max(0, 5 - active.length);
  const progress = Math.min(1, active.length / 5);

  const donut = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of active) {
      if (t.type !== "expense" || t.date < mStart || t.date > mEnd) continue;
      const id = t.categoryId ?? "cat_other";
      m.set(id, (m.get(id) ?? 0) + t.amount);
    }
    return [...m.entries()].map(([id, value]) => {
      const c = merged.find((x) => x.id === id);
      return { categoryId: id, label: c?.name ?? "Other", value, color: c?.color ?? "#888" };
    });
  }, [active, mStart, mEnd, merged]);

  const weekThis = useMemo(() => {
    const refEnd = Math.min(mEnd, now);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(refEnd);
      dayStart.setDate(dayStart.getDate() - (6 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEndMs = new Date(dayStart).setHours(23, 59, 59, 999);
      const lo = Math.max(dayStart.getTime(), mStart);
      const hi = Math.min(dayEndMs, mEnd);
      let inc = 0;
      let exp = 0;
      if (lo <= hi) {
        for (const t of active) {
          if (t.date >= lo && t.date <= hi) {
            if (t.type === "income") inc += t.amount;
            else exp += t.amount;
          }
        }
      }
      days.push({ day: format(dayStart, "EEE"), income: inc, expense: exp });
    }
    return days;
  }, [active, now, mStart, mEnd]);

  const trend = useMemo(() => {
    const out = [];
    const anchor = new Date(selY, selM - 1, 1);
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(anchor, 5 - i);
      const s = startOfMonth(d).getTime();
      const e = endOfMonth(d).getTime();
      let inc = 0;
      let exp = 0;
      for (const t of active) {
        if (t.date >= s && t.date <= e) {
          if (t.type === "income") inc += t.amount;
          else exp += t.amount;
        }
      }
      out.push({ month: format(d, "MMM"), income: inc, expense: exp });
    }
    return out;
  }, [active, selY, selM]);

  const ranking = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of active) {
      if (t.type !== "expense" || t.date < mStart || t.date > mEnd) continue;
      const id = t.categoryId ?? "cat_other";
      m.set(id, (m.get(id) ?? 0) + t.amount);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount], idx) => {
        const c = merged.find((x) => x.id === id);
        return {
          categoryId: id,
          rank: idx + 1,
          name: c?.name ?? "Other",
          amount,
          color: c?.color ?? "#888",
          icon: c?.icon ?? "circle",
        };
      });
  }, [active, mStart, mEnd, merged]);

  const paymentBreakdown = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let card = 0;
    let other = 0;
    for (const t of active) {
      if (t.type !== "expense" || t.date < mStart || t.date > mEnd) continue;
      const mode = t.paymentMode ?? null;
      if (!mode) {
        other += t.amount;
        continue;
      }
      if (typeof mode === "string" && mode.startsWith("upi_")) upi += t.amount;
      else if (mode === "cash") cash += t.amount;
      else if (mode === "card_credit" || mode === "card_debit") card += t.amount;
      else other += t.amount;
    }
    const total = upi + cash + card + other;
    return { upi, cash, card, other, total };
  }, [active, mStart, mEnd]);

  const expThis = active.filter((t) => t.type === "expense" && t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + t.amount, 0);
  const expPrev = active.filter((t) => t.type === "expense" && t.date >= prevStart && t.date <= prevEnd).reduce((s, t) => s + t.amount, 0);
  const diff = expThis - expPrev;

  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    const counts: number[][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    for (const t of active) {
      if (t.type !== "expense") continue;
      if (t.date < mStart || t.date > mEnd) continue;
      const dt = new Date(t.date);
      const dow = dt.getDay();
      const hour = dt.getHours();
      grid[dow][hour] += t.amount;
      counts[dow][hour] += 1;
    }
    const flat = grid.flat();
    const max = Math.max(...flat, 1);
    return { grid, counts, max };
  }, [active, mStart, mEnd]);

  const savingsSuggestions = useMemo(() => {
    return getSavingsSuggestions(active, goals, emis);
  }, [active, goals, emis]);

  const handleShare = async () => {
    try {
      const report = `Hindustan Pay Financial Report - ${format(new Date(selY, selM - 1, 1), "MMMM yyyy")}\n\n` +
        `Total Spending: ${formatCurrency(expThis, currency)}\n` +
        `Top Category: ${ranking[0]?.name ?? "None"}\n` +
        `Insights to note: ${insights.map(i => i.body).join(". ")}`;
      
      const path = `${FileSystem.cacheDirectory}hp_report.txt`;
      await FileSystem.writeAsStringAsync(path, report);
      await Sharing.shareAsync(path);
    } catch (err) {
      showToast({ variant: "error", message: "Failed to share report" });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22 }}>Insights</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant-outline" size={24} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => setVsLast(!vsLast)}>
              <MaterialCommunityIcons 
                name={vsLast ? "tune-vertical" : "tune-vertical-variant"} 
                size={24} 
                color={vsLast ? colors.primary : colors.textSecondary} 
              />
            </Pressable>
          </View>
        </View>
        <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{format(new Date(selY, selM - 1, 1), "MMMM yyyy")}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {Array.from({ length: 7 }, (_, idx) => {
            const d = subMonths(new Date(), 6 - idx);
            const k = d.getFullYear() * 100 + (d.getMonth() + 1);
            const selected = k === selectedMonthKey;
            return (
              <Pressable
                key={k}
                onPress={() => setSelectedMonthKey(k)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: selected ? "#fff" : colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                  {format(d, "MMM yyyy")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ gap: 12 }}>
          {[
            { t: "Top category", v: ranking[0]?.name ?? "—" },
            { t: "Spend this month", v: formatCurrency(expThis, currency, { compact: true }) },
            { t: "Δ vs last month", v: `${diff >= 0 ? "+" : ""}${formatCurrency(Math.abs(diff), currency, { compact: true })}` },
          ].map((c) => (
            <View key={c.t} style={{ width: 160, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{c.t}</Text>
              <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 8 }} numberOfLines={2}>
                {c.v}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ marginTop: 24, position: "relative", minHeight: 400 }}>
          <View style={{ opacity: locked ? 0.4 : 1 }} pointerEvents={locked ? "none" : "auto"}>
            <Animated.View style={{ opacity: chartFade }}>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 8 }}>Spending by category</Text>
            <View style={{ height: 220, alignItems: "center" }}>
              <SpendingDonut data={donut.map(({ label, value, color }) => ({ label, value, color }))} size={220} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {donut.map((s) => (
                <Pressable
                  key={s.categoryId}
                  onPress={() => setDetailCategoryId(s.categoryId)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                  <Text style={{ color: colors.textPrimary, fontSize: 12 }}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            {vsLast ? (
              <View style={{ marginTop: 12 }}>
                <ComparisonBanner
                  positive={diff <= 0}
                  label={`${diff <= 0 ? "You spent less" : "You spent more"} than last month (${formatCurrency(Math.abs(diff), currency)}).`}
                />
              </View>
            ) : null}

            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 24 }}>Weekly comparison</Text>
            <View style={{ height: 200, marginTop: 8 }}>
              <WeeklyBarChart data={weekThis} height={200} />
            </View>

            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 24 }}>6-month trend</Text>
            <View style={{ height: 240, marginTop: 8 }}>
              <TrendLineChart data={trend} height={240} />
            </View>

            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 24 }}>Top categories</Text>
            <View style={{ marginTop: 8 }}>
              <CategoryRanking rows={ranking} onPressRow={(id) => setDetailCategoryId(id)} />
            </View>

            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 24 }}>Payment Mode Breakdown</Text>
            <View style={{ marginTop: 10, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              {paymentBreakdown.total > 0 ? (
                <>
                  <View style={{ flexDirection: "row", height: 10, borderRadius: 999, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ width: `${(paymentBreakdown.upi / paymentBreakdown.total) * 100}%`, backgroundColor: "#5F259F" }} />
                    <View style={{ width: `${(paymentBreakdown.cash / paymentBreakdown.total) * 100}%`, backgroundColor: "#4CAF82" }} />
                    <View style={{ width: `${(paymentBreakdown.card / paymentBreakdown.total) * 100}%`, backgroundColor: "#4FC3F7" }} />
                    <View style={{ width: `${(paymentBreakdown.other / paymentBreakdown.total) * 100}%`, backgroundColor: colors.surfaceElevated }} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>UPI</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 12 }}>
                      {Math.round((paymentBreakdown.upi / paymentBreakdown.total) * 100)}% ·{" "}
                      {formatCurrency(paymentBreakdown.upi, currency)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cash</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 12 }}>
                      {Math.round((paymentBreakdown.cash / paymentBreakdown.total) * 100)}% ·{" "}
                      {formatCurrency(paymentBreakdown.cash, currency)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Card</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 12 }}>
                      {Math.round((paymentBreakdown.card / paymentBreakdown.total) * 100)}% ·{" "}
                      {formatCurrency(paymentBreakdown.card, currency)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No expenses in this month yet.</Text>
              )}
            </View>

            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 16 }}>Spending heatmap (week × hour)</Text>
            {heatmapTip ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  {heatmapTip.count} transaction{heatmapTip.count === 1 ? "" : "s"}, avg{" "}
                  {formatCurrency(heatmapTip.count > 0 ? heatmapTip.total / heatmapTip.count : 0, currency)}
                </Text>
              </View>
            ) : null}
            <View style={{ marginTop: 8 }}>
              {heatmap.grid.map((row, di) => (
                <View key={di} style={{ flexDirection: "row", gap: 2, marginBottom: 2 }}>
                  {row.map((cell, hi) => {
                    const cnt = heatmap.counts[di][hi];
                    const rgb = colors.primary.replace("#", "");
                    const r = parseInt(rgb.slice(0, 2), 16);
                    const g = parseInt(rgb.slice(2, 4), 16);
                    const b = parseInt(rgb.slice(4, 6), 16);
                    const a = 0.15 + (cell / heatmap.max) * 0.85;
                    return (
                      <Pressable
                        key={hi}
                        onPress={() => setHeatmapTip({ dow: di, hour: hi, count: cnt, total: cell })}
                        style={{
                          flex: 1,
                          height: 10,
                          borderRadius: 2,
                          backgroundColor: cnt > 0 ? `rgba(${r},${g},${b},${a})` : colors.border,
                        }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
            </Animated.View>
          </View>

          {locked ? (
            <>
              <BlurView
                intensity={28}
                tint={isDark ? "dark" : "light"}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: "28%",
                  padding: 20,
                  borderRadius: 18,
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 18, textAlign: "center" }}>
                  Insights locked
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 10 }}>
                  Add {need} more transaction{need === 1 ? "" : "s"} to unlock full charts and patterns.
                </Text>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 16, overflow: "hidden" }}>
                  <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: colors.primary }} />
                </View>
                <View style={{ marginTop: 16 }}>
                  <Button title="Add transaction" onPress={() => router.push("/modals/add-transaction" as never)} />
                </View>
              </View>
            </>
          ) : null}
        </View>

        <SavingsSuggestions 
          suggestions={savingsSuggestions} 
          onAction={(id) => {
            if (id === "goal_nudge") router.push("/(tabs)/goals" as never);
            else if (id === "sub_audit") router.push("/(tabs)/transactions" as never);
            else if (id === "emi_prepay") router.push("/(tabs)/goals" as never); // EMI info is in goals/net worth area
          }} 
        />

        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 24 }}>Smart insights</Text>
        {insights.map((ins) => (
          <InsightCard
            key={ins.id}
            insight={ins}
            onDismiss={() => void dismissInsight(ins.id)}
          />
        ))}
      </ScrollView>
      <CategoryDetailModal
        visible={detailCategoryId != null}
        categoryId={detailCategoryId}
        monthStart={mStart}
        monthEnd={mEnd}
        monthLabel={format(new Date(selY, selM - 1, 1), "MMMM yyyy")}
        onClose={() => setDetailCategoryId(null)}
      />
    </SafeAreaView>
  );
}

export default function InsightsScreen() {
  return (
    <ErrorBoundary label="Insights">
      <InsightsBody />
    </ErrorBoundary>
  );
}
