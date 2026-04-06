import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AmountInput } from "@/components/transactions/AmountInput";
import { Button } from "@/components/ui/Button";
import { CategoryPickerSheet } from "@/components/goals/CategoryPickerSheet";
import { useCurrency } from "@/hooks/useCurrency";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import {
  addMonthsToMonthKey,
  applyBudgetsForManyMonths,
  currentBudgetMonthKey,
  deleteBudgetById,
  findBudgetByCategoryAndMonth,
  fetchBudgetById,
  setBudgetForCategoryMonth,
  updateBudgetLimits,
} from "@/db/queries/budgets";
import { useSettingsStore } from "@/store/useSettingsStore";
import { scheduleOrCancelBudgetAlerts } from "@/utils/notifications";
import { useToastStore } from "@/components/ui/Toast";

type Threshold = 50 | 70 | 80 | 90;
type ApplyTo = "this_month" | "next_month" | "all_future";

export default function AddBudgetModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id;
  const { colors } = useTheme();
  const merged = useMergedCategories();
  const currency = useCurrency();
  const { success } = useHaptics();
  const showToast = useToastStore((s) => s.show);
  const sheetRef = useRef<BottomSheetModal>(null);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [threshold, setThreshold] = useState<Threshold>(80);
  const [applyTo, setApplyTo] = useState<ApplyTo>("this_month");
  const [catError, setCatError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [dupError, setDupError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editId;

  useEffect(() => {
    if (!editId) return;
    const b = fetchBudgetById(editId);
    if (!b) return;
    setCategoryId(b.categoryId);
    setAmountStr(String(b.monthlyLimit));
    setThreshold((b.alertThresholdPct as Threshold) ?? 80);
  }, [editId]);

  const selectedCat = useMemo(
    () => (categoryId ? merged.find((c) => c.id === categoryId) : null),
    [categoryId, merged],
  );

  const onSave = async () => {
    setCatError("");
    setAmountError("");
    setDupError("");
    if (!categoryId) {
      setCatError("Please select a category");
      return;
    }
    const amt = parseFloat(amountStr || "0");
    if (!amt || amt <= 0) {
      setAmountError("Please enter an amount");
      return;
    }

    setSubmitting(true);
    try {
      const notif = useSettingsStore.getState().notificationSettings;
      if (isEdit && editId) {
        updateBudgetLimits(editId, amt, threshold);
        await scheduleOrCancelBudgetAlerts({
          ...notif,
          budgetAlertThreshold: notif.budgetAlertThreshold ?? notif.budgetThresholdPct,
        });
        success();
        showToast({ variant: "success", message: "Budget updated" });
        router.back();
        return;
      }

      const cur = currentBudgetMonthKey();
      const months =
        applyTo === "this_month"
          ? [cur]
          : applyTo === "next_month"
            ? [addMonthsToMonthKey(cur, 1)]
            : null;

      if (months) {
        const mk = months[0];
        const dup = findBudgetByCategoryAndMonth(categoryId, mk);
        if (dup) {
          const name = selectedCat?.name ?? "This category";
          setDupError(`A budget for ${name} already exists this month. Edit it instead.`);
          return;
        }
        setBudgetForCategoryMonth(categoryId, mk, amt, threshold, null);
      } else {
        applyBudgetsForManyMonths(categoryId, cur, amt, threshold);
      }

      await scheduleOrCancelBudgetAlerts({
        ...notif,
        budgetAlertThreshold: notif.budgetAlertThreshold ?? notif.budgetThresholdPct,
      });
      success();
      showToast({ variant: "success", message: "Budget saved" });
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = () => {
    if (!editId) return;
    Alert.alert("Delete budget", "Remove this budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteBudgetById(editId);
          void scheduleOrCancelBudgetAlerts(useSettingsStore.getState().notificationSettings);
          router.back();
        },
      },
    ]);
  };

  const chip = (label: string, sel: boolean, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: sel ? colors.primary : colors.surfaceElevated,
        borderWidth: 1,
        borderColor: sel ? colors.primary : colors.border,
      }}
    >
      <Text style={{ color: sel ? "#fff" : colors.primary, fontFamily: "Inter_500Medium", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 48 }}>
      <CategoryPickerSheet
        ref={sheetRef}
        onSelect={(c) => {
          setCategoryId(c.id);
          sheetRef.current?.dismiss();
        }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: "center", color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18 }}>
          {isEdit ? "Edit Budget" : "New Budget"}
        </Text>
        {isEdit ? (
          <Pressable onPress={onDelete} hitSlop={12}>
            <Text style={{ color: colors.error, fontFamily: "Inter_500Medium" }}>Delete</Text>
          </Pressable>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Category</Text>
        {isEdit && selectedCat ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textSecondary} />
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: selectedCat.color + "33",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name={selectedCat.icon as never} size={22} color={selectedCat.color} />
            </View>
            <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", flex: 1 }}>{selectedCat.name}</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => sheetRef.current?.present()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            {selectedCat ? (
              <>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: selectedCat.color + "33",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons name={selectedCat.icon as never} size={22} color={selectedCat.color} />
                </View>
                <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", flex: 1 }}>{selectedCat.name}</Text>
              </>
            ) : (
              <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium", flex: 1 }}>Select category</Text>
            )}
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </Pressable>
        )}
        {catError ? <Text style={{ color: colors.error, marginTop: 6 }}>{catError}</Text> : null}

        <Text style={{ color: colors.textSecondary, marginTop: 24, marginBottom: 8 }}>Monthly limit</Text>
        <AmountInput value={amountStr} onChange={setAmountStr} currency={currency} />
        {amountError ? <Text style={{ color: colors.error, marginTop: 6 }}>{amountError}</Text> : null}

        <Text style={{ color: colors.textSecondary, marginTop: 24, marginBottom: 10 }}>Alert me when I reach</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {([50, 70, 80, 90] as const).map((p) => (
            <View key={p}>{chip(`${p}%`, threshold === p, () => setThreshold(p))}</View>
          ))}
        </View>

        {!isEdit ? (
          <>
            <Text style={{ color: colors.textSecondary, marginTop: 24, marginBottom: 10 }}>Apply to</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {chip("This month", applyTo === "this_month", () => setApplyTo("this_month"))}
              {chip("Next month", applyTo === "next_month", () => setApplyTo("next_month"))}
              {chip("All future months", applyTo === "all_future", () => setApplyTo("all_future"))}
            </View>
          </>
        ) : null}

        {dupError ? <Text style={{ color: colors.error, marginTop: 16 }}>{dupError}</Text> : null}

        <View style={{ marginTop: 32 }}>
          <Button title="Save budget" onPress={() => void onSave()} disabled={submitting} />
        </View>
      </ScrollView>
    </View>
  );
}
