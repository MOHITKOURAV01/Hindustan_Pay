import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/utils/formatCurrency";
import { radius } from "@/constants/theme";

type BudgetSummary = {
  id: string;
  name: string;
  spent: number;
  limit: number;
  color: string;
  icon: string;
};

type Props = {
  budgets: BudgetSummary[];
  currency: string;
};

export function MonthlyBudgetCard({ budgets, currency }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const { totalSpent, totalLimit, pct } = useMemo(() => {
    const s = budgets.reduce((acc, b) => acc + b.spent, 0);
    const l = budgets.reduce((acc, b) => acc + b.limit, 0);
    return {
      totalSpent: s,
      totalLimit: l,
      pct: l > 0 ? (s / l) * 100 : 0,
    };
  }, [budgets]);

  const statusColor = useMemo(() => {
    if (pct < 70) return colors.success;
    if (pct < 90) return colors.warning;
    return colors.error;
  }, [pct, colors]);

  if (budgets.length === 0) return null;

  const top5 = budgets.slice(0, 5);

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/goals" as any)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16 }}>
            Monthly Budget
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {formatCurrency(totalSpent, currency as any)} of {formatCurrency(totalLimit, currency as any)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: statusColor, fontFamily: "SpaceGrotesk_700Bold", fontSize: 18 }}>
            {Math.round(pct)}%
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 10, textTransform: "uppercase" }}>used</Text>
        </View>
      </View>

      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceElevated, marginBottom: 20, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${Math.min(100, pct)}%`, backgroundColor: statusColor }} />
      </View>

      <View style={{ gap: 10 }}>
        {top5.map((b) => {
          const bPct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
          const bColor = bPct > 100 ? colors.error : bPct > 80 ? colors.warning : colors.primary;
          
          return (
            <View key={b.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: `${b.color}15`, alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name={b.icon as any} size={14} color={b.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, fontFamily: "Inter_500Medium" }}>{b.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {formatCurrency(b.spent, currency as any)}
                  </Text>
                </View>
                <View style={{ height: 3, borderRadius: 1.5, backgroundColor: colors.surfaceElevated, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${Math.min(100, bPct)}%`, backgroundColor: bColor }} />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 4 }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>View all budgets</Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color={colors.primary} />
      </View>
    </Pressable>
  );
}
