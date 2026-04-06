import { Text, View } from "react-native";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTheme } from "@/hooks/useTheme";

export function GoalProgress({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginVertical: 8 }}>
      <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      <ProgressBar value={value} />
    </View>
  );
}
