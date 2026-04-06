import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AmountInput } from "@/components/transactions/AmountInput";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { useTransactionStore } from "@/store/useTransactionStore";
import { fetchTransactionById } from "@/db/queries/transactions";
import { transactionSchema, type TransactionFormValues } from "@/utils/validators";

export default function EditTransactionModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const currency = useCurrency();
  const update = useTransactionStore((s) => s.updateTransaction);
  const reload = useTransactionStore((s) => s.loadTransactions);
  const [amountStr, setAmountStr] = useState("");

  const { control, handleSubmit, reset, setValue, watch } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      type: "expense",
      categoryId: "",
      title: "",
      notes: "",
      date: Date.now(),
    },
  });

  const type = watch("type");

  useEffect(() => {
    const t = id ? fetchTransactionById(id) : undefined;
    if (!t) return;
    reset({
      amount: t.amount,
      type: t.type,
      categoryId: t.categoryId ?? "",
      title: t.title ?? "",
      notes: t.notes ?? "",
      date: t.date,
    });
    setAmountStr(String(t.amount));
  }, [id, reset]);

  const save = handleSubmit((values) => {
    if (!id) return;
    update(id, {
      amount: values.amount,
      type: values.type,
      categoryId: values.categoryId,
      title: values.title,
      notes: values.notes ?? null,
      date: values.date,
    });
    reload();
    router.back();
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 48 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Close</Text>
        </Pressable>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18 }}>Edit</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <AmountInput value={amountStr} onChange={setAmountStr} currency={currency} />
        <View style={{ flexDirection: "row", gap: 10, marginVertical: 16 }}>
          {(["expense", "income"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setValue("type", t)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: type === t ? "rgba(108,99,255,0.25)" : colors.surfaceElevated,
                borderWidth: 1,
                borderColor: type === t ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: colors.textPrimary, textAlign: "center", textTransform: "capitalize" }}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => <CategoryPicker type={type} value={field.value} onChange={field.onChange} />}
        />
        <Controller
          control={control}
          name="title"
          render={({ field }) => <Input label="Description" value={field.value} onChangeText={field.onChange} />}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field }) => <Input label="Notes" value={field.value ?? ""} onChangeText={field.onChange} multiline />}
        />
        <Button
          title="Save changes"
          onPress={() => {
            setValue("amount", parseFloat(amountStr || "0"), { shouldValidate: true });
            void save();
          }}
        />
      </ScrollView>
    </View>
  );
}
