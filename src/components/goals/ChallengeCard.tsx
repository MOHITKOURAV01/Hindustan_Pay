import { Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { Goal } from "@/types/goal";

export function ChallengeCard({ goal }: { goal: Goal }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceElevated,
      }}
    >
      <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 17 }}>{goal.title}</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Streak: {goal.streakCount} days</Text>
    </View>
  );
}
