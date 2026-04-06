import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export function ProgressBar({ value }: { value: number }) {
  const { colors } = useTheme();
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <View style={{ height: 8, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${pct}%`, height: "100%" }}
      />
    </View>
  );
}
