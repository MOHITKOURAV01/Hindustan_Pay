import { useEffect, useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchTransactionById } from "@/db/queries/transactions";
import { DateTimePickerModal } from "@/components/ui/DateTimePickerModal";
import LottieView from "lottie-react-native";
import { nanoid } from "nanoid/non-secure";
import { AmountInput } from "@/components/transactions/AmountInput";
import { CategoryPicker } from "@/components/transactions/CategoryPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCurrency } from "@/hooks/useCurrency";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useInsightStore } from "@/store/useInsightStore";
import { transactionSchema, type TransactionFormValues } from "@/utils/validators";
import type { PaymentMode, Transaction } from "@/types/transaction";
import { UPI_APPS } from "@/constants/indianFinance";
import { VoiceInputSheet, type VoiceInputSheetRef } from "@/components/transactions/VoiceInputSheet";
import { Analytics, Perf } from "@/utils/analytics";

const LAST_MODE_KEY = "hp_last_payment_mode";

const [gpay, phonepe, paytm, bhim, amazonpay, cred] = UPI_APPS;

const paymentModeOptions: { value: PaymentMode; label: string; icon: string; color: string }[] = [
  { value: "upi_gpay", label: gpay?.name ?? "Google Pay", icon: gpay?.icon ?? "google-play", color: gpay?.color ?? "#4285F4" },
  { value: "upi_phonepe", label: phonepe?.name ?? "PhonePe", icon: phonepe?.icon ?? "phone", color: phonepe?.color ?? "#5F259F" },
  { value: "upi_paytm", label: paytm?.name ?? "Paytm", icon: paytm?.icon ?? "wallet", color: paytm?.color ?? "#002970" },
  { value: "upi_bhim", label: bhim?.name ?? "BHIM", icon: bhim?.icon ?? "bank", color: bhim?.color ?? "#00838F" },
  { value: "upi_amazonpay", label: amazonpay?.name ?? "Amazon Pay", icon: amazonpay?.icon ?? "cart", color: amazonpay?.color ?? "#FF9900" },
  { value: "upi_cred", label: cred?.name ?? "CRED", icon: cred?.icon ?? "credit-card", color: cred?.color ?? "#1C1C1C" },
  { value: "cash", label: "Cash", icon: "cash", color: "#4CAF82" },
  { value: "card_credit", label: "Credit Card", icon: "credit-card-outline", color: "#4FC3F7" },
  { value: "card_debit", label: "Debit Card", icon: "credit-card", color: "#4FC3F7" },
  { value: "net_banking", label: "Net Banking", icon: "bank-transfer", color: "#FFB347" },
  { value: "wallet", label: "Wallet", icon: "wallet-outline", color: "#FF6B9D" },
  { value: "cheque", label: "Cheque", icon: "checkbook", color: "#8888AA" },
  { value: "emi", label: "EMI", icon: "calendar-month", color: "#E53935" },
];

export default function AddTransactionModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; duplicateFrom?: string }>();
  const { colors } = useTheme();
  const currency = useCurrency();
  const add = useTransactionStore((s) => s.addTransaction);
  const calc = useInsightStore((s) => s.calculateInsights);
  const { success } = useHaptics();
  const [amountStr, setAmountStr] = useState("");
  const [showDate, setShowDate] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const voiceSheetRef = useRef<VoiceInputSheetRef>(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      type: params.type === "income" ? "income" : "expense",
      categoryId: "",
      title: "",
      notes: "",
      date: Date.now(),
    },
  });

  const type = watch("type");
  const selectedMode = watch("paymentMode") as PaymentMode | undefined;

  useEffect(() => {
    if (params.type === "income" || params.type === "expense") {
      setValue("type", params.type);
    }
  }, [params.type, setValue]);

  useEffect(() => {
    void (async () => {
      const raw = await AsyncStorage.getItem(LAST_MODE_KEY);
      const hit = paymentModeOptions.find((o) => o.value === raw);
      if (hit) setValue("paymentMode", hit.value);
    })();
  }, [setValue]);

  useEffect(() => {
    const id = params.duplicateFrom;
    if (!id) return;
    const src = fetchTransactionById(id);
    if (!src) return;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    reset({
      amount: src.amount,
      type: src.type,
      categoryId: src.categoryId ?? "",
      title: src.title ?? "",
      notes: src.notes ?? "",
      date: today.getTime(),
    });
    setAmountStr(String(src.amount));
  }, [params.duplicateFrom, reset]);

  const save = handleSubmit((values) => {
    Perf.start("save_transaction");
    const now = Date.now();
    const row: Transaction = {
      id: nanoid(),
      amount: values.amount,
      type: values.type,
      categoryId: values.categoryId,
      paymentMode: (values.paymentMode as PaymentMode | undefined) ?? null,
      title: values.title,
      notes: values.notes ?? null,
      date: values.date,
      createdAt: now,
      updatedAt: now,
      isRecurring: false,
      currency: "INR",
      isDeleted: false,
      isStarred: false,
      isArchived: false,
      recurrenceRule: null,
      recurrenceEndDate: null,
      parentTransactionId: null,
    };
    add(row);
    if (row.paymentMode) void AsyncStorage.setItem(LAST_MODE_KEY, row.paymentMode);
    calc();
    Analytics.track("transaction_added", { type: values.type, amount: values.amount, mode: values.paymentMode });
    success();
    Perf.stop("save_transaction");
    setCelebrate(true);
    setTimeout(() => {
      setCelebrate(false);
      router.back();
    }, 900);
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 48 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Close</Text>
        </Pressable>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18 }}>Add</Text>
        <View style={{ width: 48 }} />
      </View>
      {celebrate ? <LottieView source={require("../../assets/lottie/confetti.json")} autoPlay style={{ height: 160 }} /> : null}
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
              <Text style={{ color: colors.textPrimary, textAlign: "center", fontFamily: "Inter_500Medium", textTransform: "capitalize" }}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Category</Text>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => <CategoryPicker type={type} value={field.value} onChange={field.onChange} />}
        />
        {errors.categoryId ? <Text style={{ color: "#FF5C5C", marginTop: 6 }}>{errors.categoryId.message}</Text> : null}
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Payment Mode</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
            {paymentModeOptions.map((m) => {
              const active = selectedMode === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setValue("paymentMode", m.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: active ? `${m.color}22` : colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: active ? m.color : colors.border,
                  }}
                >
                  <MaterialCommunityIcons
                    name={m.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={16}
                    color={active ? m.color : colors.textSecondary}
                  />
                  <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View style={{ marginTop: 16 }}>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Input label="Description" value={field.value} onChangeText={field.onChange} error={errors.title?.message} />
            )}
          />
        </View>
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: colors.textSecondary }}>Notes</Text>
            <Pressable
              onPress={() => voiceSheetRef.current?.present()}
              style={{ padding: 4 }}
            >
              <MaterialCommunityIcons name="microphone" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <Input
                value={field.value ?? ""}
                onChangeText={field.onChange}
                multiline
                placeholder="Add extra details..."
              />
            )}
          />
        </View>
        <Pressable onPress={() => setShowDate(true)} style={{ marginVertical: 12 }}>
          <Text style={{ color: colors.primary }}>Pick date</Text>
        </Pressable>
        <DateTimePickerModal
          isVisible={showDate}
          mode="date"
          value={new Date(getValues("date"))}
          title="Transaction date"
          onCancel={() => setShowDate(false)}
          onConfirm={(d) => {
            setShowDate(false);
            setValue("date", d.getTime());
          }}
        />
        <Button
          title="Save transaction"
          onPress={() => {
            const n = parseFloat(amountStr || "0");
            setValue("amount", n, { shouldValidate: true });
            void save();
          }}
        />
      </ScrollView>

      <VoiceInputSheet
        ref={voiceSheetRef}
        onResult={(text) => {
          const current = getValues("notes") || "";
          setValue("notes", current ? `${current}\n${text}` : text);
        }}
      />
    </View>
  );
}
