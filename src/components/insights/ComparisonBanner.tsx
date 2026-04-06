import { Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export function ComparisonBanner({ label, positive }: { label: string; positive: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: positive ? "rgba(76,175,130,0.15)" : "rgba(255,92,92,0.12)",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: positive ? colors.success : colors.error, fontFamily: "Inter_500Medium" }}>{label}</Text>
    </View>
  );
}
