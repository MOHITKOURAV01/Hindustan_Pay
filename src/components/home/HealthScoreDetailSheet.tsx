import React, { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { HealthScoreResult } from "@/utils/calculateHealthScore";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { radius } from "@/constants/theme";

export type HealthScoreDetailSheetRef = {
  present: (score: HealthScoreResult, history: { date: number; score: number }[]) => void;
  close: () => void;
};

export const HealthScoreDetailSheet = forwardRef<HealthScoreDetailSheetRef>((_, ref) => {
  const { colors, isDark } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeData, setActiveData] = React.useState<{ score: HealthScoreResult; history: { date: number; score: number }[] } | null>(null);

  useImperativeHandle(ref, () => ({
    present: (score: HealthScoreResult, history: { date: number; score: number }[]) => {
      setActiveData({ score, history });
      bottomSheetRef.current?.expand();
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  const renderBackdrop = React.useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    [],
  );

  const tips = useMemo(() => {
    if (!activeData) return [];
    const t = [];
    const { breakdown } = activeData.score;
    if (breakdown.savingsRate < 60) t.push("Try to save at least 20% of your income to improve your score.");
    if (breakdown.budgetDiscipline < 80) t.push("Stick to your budget limits! You've overspent in some categories.");
    if (breakdown.emiBurden < 50) t.push("Your EMI burden is high. Avoid taking new loans if possible.");
    if (breakdown.consistency < 60) t.push("Your spending is erratic. Try to plan your purchases more evenly.");
    if (breakdown.goalProgress < 50) t.push("You're behind on your savings goals. Consider increasing contributions.");
    return t.length ? t : ["You're doing great! Keep maintaining your healthy financial habits."];
  }, [activeData]);

  if (!activeData) return null;

  const { score, history } = activeData;
  const historyValues = history.map((h) => h.score);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["85%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.scoreTitle, { color: colors.textSecondary }]}>FINANCIAL HEALTH SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: score.color }]}>{score.score}</Text>
            <View style={styles.scoreMeta}>
              <Text style={[styles.grade, { color: colors.textPrimary }]}>{score.grade}</Text>
              <Text style={[styles.label, { color: score.color }]}>{score.label}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>30-Day History</Text>
          <View style={styles.sparklineContainer}>
            <MiniSparkline values={historyValues.length ? historyValues : [0, 0]} height={80} color={score.color} />
          </View>
          <View style={styles.historyLabels}>
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>30 DAYS AGO</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>TODAY</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Health Breakdown</Text>
          <BreakdownItem label="Savings Rate" value={score.breakdown.savingsRate} color={colors.primary} />
          <BreakdownItem label="Budget Discipline" value={score.breakdown.budgetDiscipline} color={colors.accent} />
          <BreakdownItem label="EMI Burden (Debt)" value={score.breakdown.emiBurden} color={colors.warning} />
          <BreakdownItem label="Expense Consistency" value={score.breakdown.consistency} color={colors.secondary} />
          <BreakdownItem label="Goal Progress" value={score.breakdown.goalProgress} color={colors.success} />
        </View>

        <View style={[styles.card, { backgroundColor: `${score.color}10`, borderColor: `${score.color}30` }]}>
          <View style={styles.tipsHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={score.color} />
            <Text style={[styles.tipsTitle, { color: score.color }]}>Personalized Advice</Text>
          </View>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={[styles.tipDot, { color: score.color }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.textPrimary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

function BreakdownItem({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownHeader}>
        <Text style={[styles.breakdownLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>{value}%</Text>
      </View>
      <View style={[styles.breakdownBar, { backgroundColor: colors.surfaceElevated }]}>
        <View style={[styles.breakdownFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  scoreTitle: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  scoreMeta: {
    justifyContent: "center",
  },
  grade: {
    fontSize: 32,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  sparklineContainer: {
    paddingVertical: 10,
  },
  historyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  breakdownRow: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  breakdownValue: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  breakdownBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 3,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    paddingRight: 10,
  },
  tipDot: {
    fontSize: 18,
    lineHeight: 18,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
});
