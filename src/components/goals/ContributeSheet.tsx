import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Goal } from "@/types/goal";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { useGoalStore } from "@/store/useGoalStore";
import { AmountInput } from "@/components/transactions/AmountInput";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatCurrency";
import { MotiView } from "moti";

export type ContributeSheetRef = {
  present: (goal: Goal) => void;
  dismiss: () => void;
};

type Props = {
  currency: CurrencyCode;
  onGoalCompleted?: (goal: Goal) => void;
};

const CHIPS = ["100", "500", "1000", "5000"];

export const ContributeSheet = forwardRef<ContributeSheetRef, Props>(function ContributeSheet(
  { currency, onGoalCompleted },
  ref,
) {
  const { colors } = useTheme();
  const { light, success } = useHaptics();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [amount, setAmount] = useState("");
  const [successState, setSuccessState] = useState(false);
  const [addedAmount, setAddedAmount] = useState(0);
  const contribute = useGoalStore((s) => s.contributeToGoal);

  useImperativeHandle(ref, () => ({
    present: (g) => {
      setGoal(g);
      setAmount("");
      setSuccessState(false);
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  const onSubmit = () => {
    if (!goal) return;
    const n = parseFloat(amount || "0");
    if (!Number.isFinite(n) || n <= 0) return;
    light();
    contribute(goal.id, n);
    const updated = useGoalStore.getState().goals.find((x) => x.id === goal.id);
    const completed = updated?.isCompleted ?? false;
    if (completed && updated) {
      success();
      sheetRef.current?.dismiss();
      onGoalCompleted?.(updated);
      return;
    }
    setAddedAmount(n);
    setSuccessState(true);
    success();
    setTimeout(() => {
      setSuccessState(false);
      setAmount("");
      sheetRef.current?.dismiss();
    }, 1500);
  };

  if (!goal) return null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["45%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
      onDismiss={() => setGoal(null)}
    >
      <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        {successState ? (
          <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ alignItems: "center", paddingVertical: 32 }}>
            <MaterialCommunityIcons name="check-circle" size={56} color="#00D4AA" />
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, marginTop: 12 }}>
              +{formatCurrency(addedAmount, currency)} added
            </Text>
          </MotiView>
        ) : (
          <>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 20 }}>Add to {goal.title}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 14 }}>
              {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
            </Text>
            <View style={{ marginTop: 16 }}>
              <AmountInput value={amount} onChange={setAmount} currency={currency} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {CHIPS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    light();
                    setAmount(c);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: "rgba(108,99,255,0.2)",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>₹{c}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  light();
                  setAmount("");
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>Custom</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: 20 }}>
              <Button title="Add Contribution" onPress={onSubmit} disabled={!(parseFloat(amount || "0") > 0)} />
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ContributeSheet.displayName = "ContributeSheet";
