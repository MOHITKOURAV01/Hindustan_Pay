import { Alert, Pressable, Text, View } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Transaction } from "@/types/transaction";
import { useCategoryResolver } from "@/hooks/useCategoryResolver";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useHaptics } from "@/hooks/useHaptics";

export function RecentTransactions({
  items,
  currency,
}: {
  items: Transaction[];
  currency: CurrencyCode;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const resolveCat = useCategoryResolver();
  const { medium, heavy } = useHaptics();
  const deleteTx = useTransactionStore((s) => s.deleteTransaction);
  return (
    <View style={{ gap: 10 }}>
      {items.map((t) => {
        const cat = resolveCat(t.categoryId);
        return (
          <Pressable
            key={t.id}
            onPress={() => router.push(`/modals/transaction-detail?id=${t.id}` as never)}
            onLongPress={() => {
              medium();
              Alert.alert("Delete transaction", "Remove this transaction?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    heavy();
                    deleteTx(t.id);
                  },
                },
              ]);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Transaction ${t.title}`}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: (cat?.color ?? colors.primary) + "33",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name={(cat?.icon ?? "circle") as keyof typeof MaterialCommunityIcons.glyphMap}
                size={22}
                color={cat?.color ?? colors.primary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 15 }} numberOfLines={1}>
                {t.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{cat?.name ?? "—"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  color: t.type === "income" ? colors.success : colors.error,
                  fontFamily: "SpaceGrotesk_600SemiBold",
                  fontSize: 15,
                }}
              >
                {t.type === "expense" ? "-" : "+"}
                {formatCurrency(t.amount, currency)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                {formatDistanceToNow(t.date, { addSuffix: true })}
              </Text>
            </View>
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push("/(tabs)/transactions" as never)} accessibilityRole="link">
        <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", marginTop: 4 }}>View all</Text>
      </Pressable>
    </View>
  );
}
