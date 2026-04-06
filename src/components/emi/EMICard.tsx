import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Pressable, Text, View, ActionSheetIOS, Platform, Alert } from "react-native";
import type { EMI } from "@/types/emi";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/constants/currencies";
import { useEMIStore } from "@/store/useEMIStore";
import { useHaptics } from "@/hooks/useHaptics";
import { useRouter } from "expo-router";

type Props = {
  emi: EMI;
  onPress: (emi: EMI) => void;
  onMarkPaid: () => void;
};

const getBankColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 45%)`;
};

export function EMICard({ emi, onPress, onMarkPaid }: Props) {
  const { colors } = useTheme();
  const currencyCode = useCurrency();
  const currencySymbol = CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? "₹";
  const { deleteEMI } = useEMIStore();
  const { light, success } = useHaptics();
  const router = useRouter();

  const paidMonths = emi.tenureMonths - emi.remainingMonths;
  const progress = paidMonths / emi.tenureMonths;
  
  let progressColor = colors.primary;
  if (progress < 0.5) progressColor = colors.success;
  else if (progress < 0.8) progressColor = colors.primary;
  else if (progress < 0.95) progressColor = colors.warning;
  else progressColor = colors.success;

  const diffDays = Math.ceil((emi.nextDueDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  
  let dueDateColor = colors.textSecondary;
  if (diffDays < 5) dueDateColor = colors.error;
  else if (diffDays < 10) dueDateColor = colors.warning;
  else dueDateColor = colors.success;

  const showOptions = () => {
    light();
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Mark as Paid", "Edit", "Delete"],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) onMarkPaid();
          else if (index === 2) router.push(`/modals/add-emi?id=${emi.id}` as any);
          else if (index === 3) confirmDelete();
        },
      );
    } else {
      Alert.alert(emi.name, "Manage EMI", [
        { text: "Mark as Paid", onPress: onMarkPaid },
        { text: "Edit", onPress: () => router.push(`/modals/add-emi?id=${emi.id}` as any) },
        { text: "Delete", onPress: confirmDelete, style: "destructive" },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete EMI", `Are you sure you want to delete ${emi.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteEMI(emi.id);
          success();
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={() => onPress(emi)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: `${getBankColor(emi.bank)}15`,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: `${getBankColor(emi.bank)}30`,
            }}
          >
            <MaterialCommunityIcons name="bank-outline" size={24} color={getBankColor(emi.bank)} />
          </View>
          <View>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16 }}>
              {emi.name}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{emi.bank}</Text>
          </View>
        </View>
        <Pressable onPress={showOptions}>
          <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={{ marginBottom: 16 }}>
        <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.surfaceElevated, overflow: "hidden" }}>
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: progressColor,
              borderRadius: 6,
            }}
          />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
          {paidMonths} of {emi.tenureMonths} EMIs paid
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>Monthly EMI</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold" }}>
            {currencySymbol}{emi.emiAmount.toLocaleString()}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>Remaining</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold" }}>
            {emi.remainingMonths} months
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>Total Paid</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold" }}>
            {currencySymbol}{(paidMonths * emi.emiAmount).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MaterialCommunityIcons name="calendar" size={16} color={dueDateColor} />
          <Text style={{ color: dueDateColor, fontSize: 13, fontFamily: "Inter_500Medium" }}>
            Next due: {format(emi.nextDueDate, "dd MMM")}
          </Text>
        </View>
        {isOverdue && (
          <View style={{ backgroundColor: `${colors.error}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ color: colors.error, fontSize: 10, fontWeight: "bold" }}>OVERDUE</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
