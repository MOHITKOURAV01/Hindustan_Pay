import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import type { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { radius } from "@/constants/theme";
import type { EMI } from "@/types/emi";

function monthNet(active: Transaction[], monthStart: number, monthEnd: number) {
  let inc = 0;
  let exp = 0;
  for (const t of active) {
    if (t.date < monthStart || t.date > monthEnd) continue;
    if (t.type === "income") inc += t.amount;
    else exp += t.amount;
  }
  return inc - exp;
}

export function NetWorthCard({
  transactions,
  currency,
  emis = [],
}: {
  transactions: Transaction[];
  currency: CurrencyCode;
  emis?: EMI[];
}) {
  const { colors, isDark } = useTheme();
  const [display, setDisplay] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const sv = useSharedValue(0);

  const active = useMemo(() => transactions.filter((t) => !t.isDeleted && !t.isArchived), [transactions]);

  const { totalIncome, totalExpenses, netWorth, monthlyChange, spark } = useMemo(() => {
    let ti = 0;
    let te = 0;
    for (const t of active) {
      if (t.type === "income") ti += t.amount;
      else te += t.amount;
    }
    const nw = ti - te;
    const now = new Date();
    const thisStart = startOfMonth(now).getTime();
    const thisEnd = endOfMonth(now).getTime();
    const prevAnchor = subMonths(now, 1);
    const prevStart = startOfMonth(prevAnchor).getTime();
    const prevEnd = endOfMonth(prevAnchor).getTime();
    const thisNet = monthNet(active, thisStart, thisEnd);
    const lastNet = monthNet(active, prevStart, prevEnd);
    const trend: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const s = startOfMonth(d).getTime();
      const e = endOfMonth(d).getTime();
      trend.push(monthNet(active, s, e));
    }
    return { totalIncome: ti, totalExpenses: te, netWorth: nw, monthlyChange: thisNet - lastNet, spark: trend };
  }, [active]);

  const totalEMI = useMemo(() => emis.filter(e => e.isActive).reduce((s, e) => s + e.emiAmount, 0), [emis]);

  useAnimatedReaction(
    () => sv.value,
    (v) => {
      runOnJS(setDisplay)(Math.round(v));
    },
    [],
  );

  useEffect(() => {
    sv.value = 0;
    sv.value = withTiming(netWorth, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [netWorth, sv]);

  const up = monthlyChange >= 0;

  return (
    <BlurView
      intensity={isDark ? 28 : 40}
      tint={isDark ? "dark" : "light"}
      style={{
        borderRadius: radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ padding: 18, backgroundColor: isDark ? "rgba(18,18,26,0.65)" : "rgba(255,255,255,0.72)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>Net worth</Text>
          <Pressable onPress={() => setShowTip((v) => !v)} hitSlop={8}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        {showTip ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
            Total income minus total expenses across all time.
          </Text>
        ) : null}
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 30, marginTop: 8 }}>
          {formatCurrency(display, currency)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MaterialCommunityIcons name={up ? "trending-up" : "trending-down"} size={18} color={up ? colors.success : colors.error} />
            <Text style={{ color: up ? colors.success : colors.error, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              {up ? "+" : ""}
              {formatCurrency(monthlyChange, currency)} this month
            </Text>
          </View>
          {totalEMI > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.warning} />
              <Text style={{ color: colors.warning, fontSize: 12, fontFamily: "Inter_500Medium" }}>
                {formatCurrency(totalEMI, currency)} EMI
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.success, fontSize: 11 }}>Income</Text>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 4 }}>
              {formatCurrency(totalIncome, currency)}
            </Text>
          </View>
          <View style={{ width: 1, height: 36, backgroundColor: colors.border }} />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={{ color: colors.error, fontSize: 11 }}>Expenses</Text>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 4 }}>
              {formatCurrency(totalExpenses, currency)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>6-month trend</Text>
          <MiniSparkline values={spark} height={44} color={colors.primary} />
        </View>
      </View>
    </BlurView>
  );
}
