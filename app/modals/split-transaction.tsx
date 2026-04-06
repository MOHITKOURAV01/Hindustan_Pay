import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { nanoid } from "nanoid/non-secure";
import { fetchTransactionById, insertTransaction, softDeleteTransaction } from "@/db/queries/transactions";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToastStore } from "@/components/ui/Toast";

type SplitRow = { amount: string; categoryId: string };

export default function SplitTransactionModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const currency = useCurrency();
  const merged = useMergedCategories();
  const showToast = useToastStore((s) => s.show);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const t = id ? fetchTransactionById(id) : undefined;

  const [rows, setRows] = useState<SplitRow[]>([
    { amount: "", categoryId: merged.find((c) => c.type === "expense" || c.type === "both")?.id ?? "" },
    { amount: "", categoryId: merged.find((c) => c.type === "expense" || c.type === "both")?.id ?? "" },
  ]);

  const expenseCats = useMemo(() => merged.filter((c) => c.type === "expense" || c.type === "both"), [merged]);

  if (!t || t.type !== "expense") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: "center" }}>
        <Text style={{ color: colors.textSecondary }}>Only expense transactions can be split.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const totalAllocated = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const remaining = Math.round((t.amount - totalAllocated) * 100) / 100;
  const valid = rows.length >= 2 && remaining === 0 && rows.every((r) => (parseFloat(r.amount) || 0) > 0 && r.categoryId);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { amount: "", categoryId: expenseCats[0]?.id ?? "" },
    ]);
  };

  const confirm = () => {
    if (!valid) return;
    const now = Date.now();
    softDeleteTransaction(t.id);
    for (const r of rows) {
      const amt = parseFloat(r.amount);
      insertTransaction({
        id: nanoid(),
        amount: amt,
        type: "expense",
        categoryId: r.categoryId,
        title: t.title ? `${t.title} (split)` : "Split",
        notes: t.notes,
        date: t.date,
        createdAt: now,
        updatedAt: now,
        isRecurring: false,
        currency: t.currency,
        isDeleted: false,
        isStarred: false,
        isArchived: false,
        recurrenceRule: null,
        recurrenceEndDate: null,
        parentTransactionId: t.id,
      });
    }
    loadTransactions();
    showToast({ variant: "success", message: "Transaction split" });
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingTop: 48 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.primary }}>Close</Text>
      </Pressable>
      <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22 }}>Split transaction</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Original amount</Text>
      <Text style={{ color: colors.error, fontFamily: "SpaceGrotesk_700Bold", fontSize: 28, marginTop: 4 }}>
        {formatCurrency(t.amount, currency)}
      </Text>
      <Text style={{ color: remaining === 0 ? colors.success : colors.warning, marginTop: 12, fontFamily: "Inter_500Medium" }}>
        {remaining === 0 ? "Fully allocated" : `${formatCurrency(Math.abs(remaining), currency)} ${remaining > 0 ? "remaining to allocate" : "over allocated"}`}
      </Text>

      {rows.map((row, idx) => (
        <View key={idx} style={{ marginTop: 20, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Split {idx + 1}</Text>
          <TextInput
            value={row.amount}
            onChangeText={(v) =>
              setRows((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], amount: v };
                return next;
              })
            }
            keyboardType="decimal-pad"
            placeholder="Amount"
            placeholderTextColor={colors.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              color: colors.textPrimary,
              marginBottom: 12,
            }}
          />
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Category</Text>
          <CategoryPicker
            type="expense"
            value={row.categoryId}
            onChange={(catId) =>
              setRows((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], categoryId: catId };
                return next;
              })
            }
          />
        </View>
      ))}

      <Pressable onPress={addRow} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.primary }}>+ Add split line</Text>
      </Pressable>

      <View style={{ marginTop: 28 }}>
        <Button title="Confirm split" onPress={confirm} disabled={!valid} />
      </View>
    </ScrollView>
  );
}
