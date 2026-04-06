import { Text, View } from "react-native";
import { CartesianChart, BarGroup } from "victory-native";
import { useTheme } from "@/hooks/useTheme";

export type WeekDayDatum = { day: string; income: number; expense: number };

export function WeeklyBarChart({
  data,
  height = 200,
}: {
  data: WeekDayDatum[];
  height?: number;
}) {
  const { colors } = useTheme();
  const allZero = data.length > 0 && data.every((d) => d.income === 0 && d.expense === 0);
  if (!data.length || allZero) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textSecondary }}>No activity this period</Text>
      </View>
    );
  }
  return (
    <View style={{ height }}>
      <CartesianChart
        data={data}
        xKey="day"
        yKeys={["expense", "income"]}
        padding={{ left: 8, right: 8, top: 16, bottom: 24 }}
        domainPadding={{ left: 16, right: 16, top: 12, bottom: 8 }}
      >
        {({ chartBounds, points }) => (
          <BarGroup chartBounds={chartBounds} betweenGroupPadding={0.25} withinGroupPadding={0.2}>
            <BarGroup.Bar points={points.expense} color={colors.error} animate={{ type: "spring" }} />
            <BarGroup.Bar points={points.income} color={colors.success} animate={{ type: "spring" }} />
          </BarGroup>
        )}
      </CartesianChart>
    </View>
  );
}
