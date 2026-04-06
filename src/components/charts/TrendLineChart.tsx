import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { CartesianChart, Line, Area } from "victory-native";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/utils/formatCurrency";

export type TrendPoint = { month: string; income: number; expense: number };

export function TrendLineChart({ data, height = 220 }: { data: TrendPoint[]; height?: number }) {
  const { colors } = useTheme();
  const currency = useCurrency();
  const [tipIdx, setTipIdx] = useState<number | null>(null);
  const tipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tipIdx == null) return;
    tipOpacity.setValue(1);
    const t = setTimeout(() => {
      Animated.timing(tipOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setTipIdx(null));
    }, 2000);
    return () => clearTimeout(t);
  }, [tipIdx, tipOpacity]);

  const allZero =
    data.length > 0 && data.every((d) => (d.income ?? 0) === 0 && (d.expense ?? 0) === 0);
  if (!data.length || allZero) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textSecondary }}>No trend data</Text>
      </View>
    );
  }

  const tip = tipIdx != null ? data[tipIdx] : null;
  const seg = 100 / Math.max(1, data.length);

  return (
    <View style={{ height }}>
      <View style={{ flex: 1, position: "relative" }}>
        <CartesianChart
          data={data}
          xKey="month"
          yKeys={["income", "expense"]}
          padding={{ left: 8, right: 8, top: 12, bottom: 28 }}
          domainPadding={{ left: 12, right: 12, top: 20, bottom: 8 }}
        >
          {({ chartBounds, points }) => (
            <>
              <Area
                points={points.income}
                y0={chartBounds.bottom}
                color={`${colors.primary}40`}
                animate={{ type: "spring" }}
              />
              <Line points={points.income} color={colors.primary} strokeWidth={3} animate={{ type: "spring" }} />
              <Line points={points.expense} color={colors.accent} strokeWidth={2} animate={{ type: "spring" }} />
            </>
          )}
        </CartesianChart>
        <View
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: 0,
            bottom: 0,
            flexDirection: "row",
          }}
          pointerEvents="box-none"
        >
          {data.map((_, i) => (
            <Pressable key={i} style={{ flex: 1 }} onPress={() => setTipIdx(i)} />
          ))}
        </View>
        {tip ? (
          <Animated.View
            style={{
              position: "absolute",
              top: 4,
              left: `${seg * (tipIdx! + 0.5)}%`,
              marginLeft: -72,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: colors.surfaceElevated,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: tipOpacity,
              width: 144,
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 12, textAlign: "center" }} numberOfLines={3}>
              {tip.month}: in {formatCurrency(tip.income, currency)} · out {formatCurrency(tip.expense, currency)}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
