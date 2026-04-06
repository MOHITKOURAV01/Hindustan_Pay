import { View, Text } from "react-native";
import { PolarChart, Pie } from "victory-native";
import { useTheme } from "@/hooks/useTheme";

type Slice = { label: string; value: number; color: string };

export function SpendingDonut({ data, size = 200 }: { data: Slice[]; size?: number }) {
  const { colors } = useTheme();
  const total = data.reduce((s, x) => s + x.value, 0);
  if (!data.length || total === 0) {
    return (
      <View style={{ height: size, width: size, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" }}>No spending data</Text>
      </View>
    );
  }
  return (
    <View style={{ height: size, width: size }}>
      <PolarChart data={data} labelKey="label" valueKey="value" colorKey="color">
        <Pie.Chart innerRadius="55%">
          {() => <Pie.Slice />}
        </Pie.Chart>
      </PolarChart>
    </View>
  );
}
