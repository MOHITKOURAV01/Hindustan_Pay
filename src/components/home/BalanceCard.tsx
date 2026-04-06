import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";

export function BalanceCard({
  balance,
  delta,
  incomeMonth,
  expenseMonth,
  currency,
}: {
  balance: number;
  delta: number;
  incomeMonth: number;
  expenseMonth: number;
  currency: CurrencyCode;
}) {
  const { colors } = useTheme();
  const [display, setDisplay] = useState(0);
  const sv = useSharedValue(0);

  useAnimatedReaction(
    () => sv.value,
    (v) => {
      runOnJS(setDisplay)(Math.round(v));
    },
    [],
  );

  useEffect(() => {
    sv.value = 0;
    sv.value = withTiming(balance, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [balance, sv]);

  return (
    <LinearGradient
      colors={[`${colors.primary}59`, `${colors.secondary}33`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.lg, padding: 1 }}
    >
      <View
        style={{
          borderRadius: radius.lg - 1,
          backgroundColor: colors.card,
          padding: 20,
        }}
      >
        <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 13 }}>Total balance</Text>
        <Text
          style={{
            marginTop: 6,
            fontFamily: "SpaceGrotesk_700Bold",
            fontSize: 34,
            color: colors.textPrimary,
          }}
        >
          {formatCurrency(display, currency)}
        </Text>
        <Text
          style={{
            marginTop: 8,
            color: delta >= 0 ? colors.success : colors.error,
            fontFamily: "Inter_500Medium",
          }}
        >
          {delta >= 0 ? "+" : ""}
          {formatCurrency(delta, currency)} this month
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: "rgba(76,175,130,0.15)", padding: 10, borderRadius: radius.md }}>
            <Text style={{ color: colors.success, fontSize: 12 }}>Income</Text>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 4 }}>
              {formatCurrency(incomeMonth, currency)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "rgba(255,92,92,0.12)", padding: 10, borderRadius: radius.md }}>
            <Text style={{ color: colors.error, fontSize: 12 }}>Expense</Text>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 4 }}>
              {formatCurrency(expenseMonth, currency)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
