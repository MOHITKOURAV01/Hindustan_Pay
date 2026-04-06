import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { addDays, addMonths, addWeeks, addYears, format, isWithinInterval, startOfDay } from "date-fns";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { RecurrenceRule, Transaction } from "@/types/transaction";
import { fetchActiveWithRecurrenceRule, recurringSeriesRootId } from "@/db/queries/transactions";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { useCategoryResolver } from "@/hooks/useCategoryResolver";
import { radius } from "@/constants/theme";

function nextFrom(dateMs: number, rule: RecurrenceRule): number {
  const d = new Date(dateMs);
  switch (rule) {
    case "daily":
      return addDays(d, 1).getTime();
    case "weekly":
      return addWeeks(d, 1).getTime();
    case "monthly":
      return addMonths(d, 1).getTime();
    case "yearly":
      return addYears(d, 1).getTime();
    default:
      return dateMs;
  }
}

function datePill(nextMs: number): string {
  const next = startOfDay(new Date(nextMs));
  const today = startOfDay(new Date());
  const diff = Math.round((next.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 7) return format(next, "EEE");
  if (diff >= 7) return format(next, "MMM d");
  return `In ${Math.abs(diff)} days`;
}

export function UpcomingWidget({ currency }: { currency: CurrencyCode }) {
  const { colors } = useTheme();
  const router = useRouter();
  const resolveCat = useCategoryResolver();

  const upcoming = useMemo(() => {
    const all = fetchActiveWithRecurrenceRule();
    if (all.length === 0) return [];
    const groups = new Map<string, Transaction[]>();
    for (const t of all) {
      const key = recurringSeriesRootId(t);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    const now = Date.now();
    const weekEnd = addDays(new Date(), 7).getTime();
    const out: { t: Transaction; nextMs: number }[] = [];
    for (const [, rows] of groups) {
      const sorted = [...rows].sort((a, b) => b.date - a.date);
      const latest = sorted[0];
      const rule = latest.recurrenceRule;
      if (!rule || !["daily", "weekly", "monthly", "yearly"].includes(rule)) continue;
      let nextMs = nextFrom(latest.date, rule);
      let guard = 0;
      while (nextMs <= now && guard < 120) {
        nextMs = nextFrom(nextMs, rule);
        guard++;
      }
      if (latest.recurrenceEndDate != null && nextMs > latest.recurrenceEndDate) continue;
      if (isWithinInterval(new Date(nextMs), { start: new Date(now), end: new Date(weekEnd) })) {
        out.push({ t: latest, nextMs });
      }
    }
    out.sort((a, b) => a.nextMs - b.nextMs);
    return out.slice(0, 3);
  }, []);

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <MaterialCommunityIcons name="calendar-clock" size={22} color={colors.primary} />
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16 }}>Upcoming</Text>
      </View>
      {upcoming.length === 0 ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No scheduled transactions</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {upcoming.map(({ t, nextMs }) => {
            const cat = resolveCat(t.categoryId);
            return (
              <View key={`${t.id}-${nextMs}`} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: (cat?.color ?? colors.primary) + "44",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons name={(cat?.icon ?? "repeat") as never} size={20} color={cat?.color ?? colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium" }} numberOfLines={1}>
                    {t.title ?? "Recurring"}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{cat?.name ?? "—"}</Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold" }}>
                  {formatCurrency(t.amount, currency)}
                </Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceElevated }}>
                  <Text style={{ color: colors.primary, fontSize: 11 }}>{datePill(nextMs)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <Pressable onPress={() => router.push("/modals/add-transaction" as never)} style={{ alignSelf: "flex-end", marginTop: 12 }}>
        <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 13 }}>Add recurring</Text>
      </Pressable>
    </View>
  );
}
