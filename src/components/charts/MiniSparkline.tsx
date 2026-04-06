import { View } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { useTheme } from "@/hooks/useTheme";

export function MiniSparkline({
  values,
  height = 40,
  color,
}: {
  values: number[];
  height?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary;
  const data = values.map((y, i) => ({ i: String(i), y }));
  if (values.length < 2) return <View style={{ height }} />;
  return (
    <View style={{ height, width: 80 }}>
      <CartesianChart data={data} xKey="i" yKeys={["y"]} padding={4}>
        {({ points }) => <Line points={points.y} color={stroke} strokeWidth={2} />}
      </CartesianChart>
    </View>
  );
}
