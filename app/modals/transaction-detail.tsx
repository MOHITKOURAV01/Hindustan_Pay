import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fetchTransactionById } from "@/db/queries/transactions";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCategoryResolver } from "@/hooks/useCategoryResolver";
import { Button } from "@/components/ui/Button";

export default function TransactionDetailModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const resolveCat = useCategoryResolver();
  const currency = useCurrency();
  const deleteTx = useTransactionStore((s) => s.deleteTransaction);
  const txs = useTransactionStore((s) => s.transactions);
  const t = id ? fetchTransactionById(id) : undefined;

  const similar =
    t?.categoryId != null ? txs.filter((x) => x.categoryId === t.categoryId && x.id !== t.id).slice(0, 5) : [];

  if (!t) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.textSecondary }}>Not found</Text>
        <Button title="Close" onPress={() => router.back()} />
      </View>
    );
  }

  const cat = resolveCat(t.categoryId);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 48 }} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.primary }}>Close</Text>
      </Pressable>
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: (cat?.color ?? colors.primary) + "44",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name={(cat?.icon as never) ?? "circle"} size={36} color={cat?.color ?? colors.primary} />
        </View>
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{cat?.name}</Text>
        <Text
          style={{
            color: t.type === "income" ? colors.success : colors.error,
            fontFamily: "SpaceGrotesk_700Bold",
            fontSize: 36,
            marginTop: 8,
          }}
        >
          {t.type === "expense" ? "-" : "+"}
          {formatCurrency(t.amount, currency)}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{format(t.date, "PPpp")}</Text>
        {t.notes ? <Text style={{ color: colors.textPrimary, marginTop: 16, textAlign: "center" }}>{t.notes}</Text> : null}
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Button title="Edit" onPress={() => router.replace(`/modals/edit-transaction?id=${t.id}` as never)} />
        </View>
        {t.type === "expense" ? (
          <View style={{ flex: 1, minWidth: 120 }}>
            <Button title="Split" variant="ghost" onPress={() => router.push(`/modals/split-transaction?id=${t.id}` as never)} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 120 }}>
          <Button variant="danger" title="Delete" onPress={() => { deleteTx(t.id); router.back(); }} />
        </View>
      </View>
      <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 28 }}>Similar</Text>
      {similar.map((x) => (
        <Text key={x.id} style={{ color: colors.textSecondary, marginTop: 8 }}>
          {x.title} · {formatCurrency(x.amount, currency)}
        </Text>
      ))}
    </ScrollView>
  );
}
