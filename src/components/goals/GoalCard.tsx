import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import type { Goal } from "@/types/goal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";

export const GoalCard = memo(function GoalCard({
  goal,
  currency,
  onContribute,
}: {
  goal: Goal;
  currency: CurrencyCode;
  onContribute: () => void;
}) {
  const { colors } = useTheme();
  const pct = goal.targetAmount ? goal.currentAmount / goal.targetAmount : 0;
  const palette = [
    ["#6C63FF", "#00D4AA"],
    ["#FF6B9D", "#FFB347"],
    ["#4CAF82", "#6C63FF"],
    ["#00D4AA", "#6C63FF"],
    ["#FFB347", "#FF6B9D"],
    ["#6C63FF", "#FF6B9D"],
  ];
  const grad = palette[goal.title.length % palette.length] as [string, string];
  return (
    <MotiView from={{ rotateZ: "-2deg", scale: 0.98 }} animate={{ rotateZ: "0deg", scale: 1 }} style={{ marginBottom: 14 }}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.lg, padding: 1 }}>
        <View style={{ borderRadius: radius.lg - 1, backgroundColor: colors.card, padding: 16 }}>
          <Text style={{ fontSize: 28 }}>{goal.emoji ?? "🎯"}</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, marginTop: 4 }}>
            {goal.title}
          </Text>
          <ProgressBar value={pct} />
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
            {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
          </Text>
          <Pressable
            onPress={onContribute}
            style={{ marginTop: 12, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: "rgba(108,99,255,0.25)" }}
          >
            <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Contribute</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </MotiView>
  );
});
