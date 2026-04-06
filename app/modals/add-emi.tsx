import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetView } from "@gorhom/bottom-sheet";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { useEMIStore } from "@/store/useEMIStore";
import { fetchEMIById } from "@/db/queries/emis";
import { CURRENCIES } from "@/constants/currencies";
import { INDIAN_BANKS } from "@/constants/indianFinance";
import { Button } from "@/components/ui/Button";
import { useHaptics } from "@/hooks/useHaptics";
import { Analytics, Perf } from "@/utils/analytics";

const emiSchema = z.object({
  name: z.string().min(1, "Loan name is required"),
  bank: z.string().min(1, "Bank name is required"),
  totalAmount: z.number().positive("Amount must be positive"),
  emiAmount: z.number().positive("EMI must be positive"),
  interestRate: z.number().min(0, "Interest rate cannot be negative"),
  tenureMonths: z.number().int().positive("Tenure must be at least 1 month"),
  nextDueDate: z.number(),
});

type EMIForm = z.infer<typeof emiSchema>;

export default function AddEMIModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const currencyCode = useCurrency();
  const currencySymbol = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "₹";
  const { addEMI, updateEMI } = useEMIStore();
  const { selection, success } = useHaptics();

  const bankSheetRef = useRef<BottomSheet>(null);
  const [loading, setLoading] = useState(!!id);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EMIForm>({
    resolver: zodResolver(emiSchema),
    defaultValues: {
      name: "",
      totalAmount: 0,
      emiAmount: 0,
      interestRate: 10,
      tenureMonths: 12,
      nextDueDate: Date.now(),
    },
  });

  const selectedBank = watch("bank");
  const totalAmount = watch("totalAmount");
  const interestRate = watch("interestRate");
  const tenureMonths = watch("tenureMonths");

  useEffect(() => {
    if (id) {
      void fetchEMIById(id).then((emi) => {
        if (emi) {
          setValue("name", emi.name);
          setValue("bank", emi.bank);
          setValue("totalAmount", emi.totalAmount);
          setValue("emiAmount", emi.emiAmount);
          setValue("interestRate", emi.interestRate);
          setValue("tenureMonths", emi.tenureMonths);
          setValue("nextDueDate", emi.nextDueDate);
        }
        setLoading(false);
      });
    }
  }, [id, setValue]);

  const calculateEMI = () => {
    if (totalAmount > 0 && interestRate > 0 && tenureMonths > 0) {
      const r = interestRate / (12 * 100);
      const n = tenureMonths;
      const emi = (totalAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setValue("emiAmount", Math.round(emi));
    }
  };

  const onSubmit = async (data: EMIForm) => {
    try {
      Perf.start("save_emi");
      if (id) {
        await updateEMI(id, { ...data, startDate: data.nextDueDate });
      } else {
        await addEMI({
          ...data,
          startDate: Date.now(),
          remainingMonths: data.tenureMonths,
          isActive: 1,
        });
      }
      Analytics.track("emi_tracked", { bank: data.bank, amount: data.totalAmount });
      success();
      Perf.stop("save_emi");
      router.back();
    } catch (error) {
      console.error(error);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 60,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" }}>
            {id ? "Edit EMI" : "Add EMI Tracker"}
          </Text>
          <Pressable onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
            <Text
              style={{
                color: isSubmitting ? colors.textSecondary : colors.primary,
                fontSize: 16,
                fontFamily: "SpaceGrotesk_600SemiBold",
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>LOAN NAME</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="e.g. Home Loan, Car Loan"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    color: colors.textPrimary,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: errors.name ? colors.error : colors.border,
                  }}
                />
              )}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>BANK / PROVIDER</Text>
            <Pressable
              onPress={() => {
                selection();
                bankSheetRef.current?.expand();
              }}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: errors.bank ? colors.error : colors.border,
              }}
            >
              <Text style={{ color: selectedBank ? colors.textPrimary : colors.textSecondary, fontSize: 16 }}>
                {selectedBank || "Select bank"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>LOAN AMOUNT</Text>
              <Controller
                control={control}
                name="totalAmount"
                render={({ field: { onChange, value } }) => (
                  <View style={{ position: "relative" }}>
                    <Text style={{ position: "absolute", left: 16, top: 16, color: colors.textSecondary, fontSize: 16 }}>
                      {currencySymbol}
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={value === 0 ? "" : value.toString()}
                      onChangeText={(v) => onChange(Number(v))}
                      onBlur={calculateEMI}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        padding: 16,
                        paddingLeft: 32,
                        color: colors.textPrimary,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: errors.totalAmount ? colors.error : colors.border,
                      }}
                    />
                  </View>
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>TENURE (MONTHS)</Text>
              <Controller
                control={control}
                name="tenureMonths"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="numeric"
                    value={value.toString()}
                    onChangeText={(v) => onChange(Number(v))}
                    onBlur={calculateEMI}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      color: colors.textPrimary,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: errors.tenureMonths ? colors.error : colors.border,
                    }}
                  />
                )}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>INTEREST RATE (%)</Text>
              <Controller
                control={control}
                name="interestRate"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="numeric"
                    value={value.toString()}
                    onChangeText={(v) => onChange(Number(v))}
                    onBlur={calculateEMI}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      color: colors.textPrimary,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: errors.interestRate ? colors.error : colors.border,
                    }}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>MONTHLY EMI</Text>
              <Controller
                control={control}
                name="emiAmount"
                render={({ field: { onChange, value } }) => (
                  <View style={{ position: "relative" }}>
                    <Text style={{ position: "absolute", left: 16, top: 16, color: colors.textSecondary, fontSize: 16 }}>
                      {currencySymbol}
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={value === 0 ? "" : value.toString()}
                      onChangeText={(v) => onChange(Number(v))}
                      style={{
                        backgroundColor: colors.surfaceElevated,
                        borderRadius: 12,
                        padding: 16,
                        paddingLeft: 32,
                        color: colors.primary,
                        fontSize: 16,
                        fontFamily: "SpaceGrotesk_600SemiBold",
                        borderWidth: 1,
                        borderColor: colors.primary,
                      }}
                    />
                  </View>
                )}
              />
            </View>
          </View>

          <View
            style={{
              marginTop: 10,
              padding: 16,
              borderRadius: 16,
              backgroundColor: `${colors.primary}10`,
              borderWidth: 1,
              borderColor: `${colors.primary}30`,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <MaterialCommunityIcons name="information-outline" size={24} color={colors.primary} />
            <Text style={{ color: colors.textPrimary, flex: 1, fontSize: 13 }}>
              EMI is automatically calculated based on principal, rate and tenure. You can also edit it manually.
            </Text>
          </View>
        </ScrollView>

        <BottomSheet
          ref={bankSheetRef}
          index={-1}
          snapPoints={["50%", "80%"]}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
          handleIndicatorStyle={{ backgroundColor: colors.border }}
        >
          <BottomSheetView style={{ flex: 1, padding: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 20 }}>
              Select Bank
            </Text>
            <BottomSheetFlatList
              data={[...INDIAN_BANKS, "Other"]}
              keyExtractor={(item: string) => String(item)}
              renderItem={({ item }: { item: string }) => {
                const bankName = String(item);
                return (
                  <Pressable
                    onPress={() => {
                      setValue("bank", item);
                      bankSheetRef.current?.close();
                    }}
                    style={{
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{item}</Text>
                    {selectedBank === item && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </BottomSheetView>
        </BottomSheet>
      </View>
    </KeyboardAvoidingView>
  );
}
