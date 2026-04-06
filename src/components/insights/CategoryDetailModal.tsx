import { useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@/components/ui/Button";

export function CategoryDetailModal({
  visible,
  categoryId,
  monthStart,
  monthEnd,
  monthLabel,
  onClose,
}: {
  visible: boolean;
  categoryId: string | null;
  monthStart: number;
  monthEnd: number;
  monthLabel: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const currency = useCurrency();
  const router = useRouter();
  const txs = useTransactionStore((s) => s.transactions);
  const merged = useMergedCategories();

  const cat = categoryId ? merged.find((c) => c.id === categoryId) : undefined;

  const { total, pct, list, bars } = useMemo(() => {
    if (!categoryId) {
      return { total: 0, pct: 0, list: [] as typeof txs, bars: [] as { label: string; v: number }[] };
    }
    const active = txs.filter((t) => !t.isDeleted && !t.isArchived);
    const monthExp = active.filter((t) => t.type === "expense" && t.date >= monthStart && t.date <= monthEnd).reduce((s, t) => s + t.amount, 0);
    const catTx = active.filter(
      (t) => t.type === "expense" && t.categoryId === categoryId && t.date >= monthStart && t.date <= monthEnd,
    );
    const tot = catTx.reduce((s, t) => s + t.amount, 0);
    const p = monthExp > 0 ? (tot / monthExp) * 100 : 0;
    const anchor = new Date(monthStart);
    const barData: { label: string; v: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(anchor, 5 - i);
      const s = startOfMonth(d).getTime();
      const e = endOfMonth(d).getTime();
      let v = 0;
      for (const t of active) {
        if (t.type === "expense" && t.categoryId === categoryId && t.date >= s && t.date <= e) v += t.amount;
      }
      barData.push({ label: format(d, "MMM"), v });
    }
    return {
      total: tot,
      pct: p,
      list: [...catTx].sort((a, b) => b.date - a.date).slice(0, 40),
      bars: barData,
    };
  }, [txs, categoryId, monthStart, monthEnd]);

  const maxBar = Math.max(...bars.map((b) => b.v), 1);

  if (!visible || !categoryId) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }} onPress={onClose} />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "82%",
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 28,
        }}
      >
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: (cat?.color ?? colors.primary) + "44",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name={(cat?.icon ?? "circle") as never} size={26} color={cat?.color ?? colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18 }}>{cat?.name ?? "Category"}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {monthLabel} · {formatCurrency(total, currency)} ({pct.toFixed(0)}% of spend)
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginHorizontal: 16, marginBottom: 8 }}>
          Last 6 months
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", height: 72, paddingHorizontal: 16, gap: 6, marginBottom: 12 }}>
          {bars.map((b) => {
            const h = Math.max(6, Math.round((b.v / maxBar) * 56));
            return (
              <View key={b.label} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: 64 }}>
                <View style={{ width: "100%", height: h, backgroundColor: colors.primary, borderRadius: 4 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>{b.label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", marginHorizontal: 16, marginBottom: 8 }}>
          Transactions
        </Text>
        <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {list.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>No transactions this month.</Text>
          ) : (
            list.map((t) => (
              <View
                key={t.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                  {t.title ?? "—"}
                </Text>
                <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold" }}>{formatCurrency(t.amount, currency)}</Text>
              </View>
            ))
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Button
            title={cat?.name ? `View all ${cat.name} transactions` : "View all transactions"}
            onPress={() => {
              onClose();
              router.push(`/(tabs)/transactions?categoryId=${categoryId}` as never);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
