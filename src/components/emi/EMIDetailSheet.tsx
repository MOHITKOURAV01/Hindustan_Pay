import React, { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import type { EMI } from "@/types/emi";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/constants/currencies";
import { Button } from "@/components/ui/Button";

export type EMIDetailSheetRef = {
  present: (emi: EMI) => void;
  close: () => void;
};

type Props = {
  onMarkPaid: (emi: EMI) => void;
  onEdit: (emi: EMI) => void;
};

export const EMIDetailSheet = forwardRef<EMIDetailSheetRef, Props>(({ onMarkPaid, onEdit }, ref) => {
  const { colors } = useTheme();
  const currencyCode = useCurrency();
  const currencySymbol = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "₹";
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeEMI, setActiveEMI] = React.useState<EMI | null>(null);

  useImperativeHandle(ref, () => ({
    present: (emi: EMI) => {
      setActiveEMI(emi);
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

  const stats = useMemo(() => {
    if (!activeEMI) return null;
    const paidMonths = activeEMI.tenureMonths - activeEMI.remainingMonths;
    const totalPaid = paidMonths * activeEMI.emiAmount;
    const remainingToPay = activeEMI.remainingMonths * activeEMI.emiAmount;
    const totalLoanCost = activeEMI.tenureMonths * activeEMI.emiAmount;
    const totalInterest = totalLoanCost - activeEMI.totalAmount;
    const progress = paidMonths / activeEMI.tenureMonths;

    return {
      paidMonths,
      totalPaid,
      remainingToPay,
      totalLoanCost,
      totalInterest,
      progress,
    };
  }, [activeEMI]);

  if (!activeEMI || !stats) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["80%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <MaterialCommunityIcons name="bank" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{activeEMI.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{activeEMI.bank}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Financial Progress</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceElevated }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.progress * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textPrimary }]}>
              {Math.round(stats.progress * 100)}% Repaid
            </Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Principal</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {currencySymbol}{activeEMI.totalAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Interest (Est.)</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {currencySymbol}{Math.round(stats.totalInterest).toLocaleString()}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Total Payable</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {currencySymbol}{Math.round(stats.totalLoanCost).toLocaleString()}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Interest Rate</Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>{activeEMI.interestRate}% p.a.</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Repayment Details</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Monthly EMI</Text>
            <Text style={[styles.rowValue, { color: colors.primary }]}>
              {currencySymbol}{activeEMI.emiAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Tenure</Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{activeEMI.tenureMonths} Months</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Months Paid</Text>
            <Text style={[styles.rowValue, { color: colors.success }]}>{stats.paidMonths} Months</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Months Remaining</Text>
            <Text style={[styles.rowValue, { color: colors.warning }]}>{activeEMI.remainingMonths} Months</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Next Due Date</Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
              {format(activeEMI.nextDueDate, "dd MMMM yyyy")}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Mark this month as Paid"
            onPress={() => {
              onMarkPaid(activeEMI);
              bottomSheetRef.current?.close();
            }}
            style={styles.actionBtn}
          />
          <Button
            title="Edit EMI Details"
            variant="ghost"
            onPress={() => {
              onEdit(activeEMI);
              bottomSheetRef.current?.close();
            }}
            style={styles.actionBtn}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridItem: {
    width: "47%",
  },
  label: {
    fontSize: 11,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  actionBtn: {
    width: "100%",
  },
});
