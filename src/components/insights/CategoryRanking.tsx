import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useTheme } from "@/hooks/useTheme";

export function CategoryRanking({
  rows,
  onPressRow,
}: {
  rows: { categoryId: string; rank: number; name: string; amount: number; color: string; icon: string }[];
  onPressRow?: (categoryId: string) => void;
}) {
  const { colors } = useTheme();
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <View style={{ gap: 12 }}>
      {rows.map((r, i) => (
        <MotiView key={r.categoryId} from={{ opacity: 0, translateX: 12 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 50 }}>
          <Pressable
            onPress={() => onPressRow?.(r.categoryId)}
            disabled={!onPressRow}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Text style={{ color: colors.textSecondary, width: 20 }}>{r.rank}</Text>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: r.color + "44", alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons name={r.icon as never} size={20} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium" }}>{r.name}</Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 6, overflow: "hidden" }}>
                <View style={{ width: `${(r.amount / max) * 100}%`, height: "100%", backgroundColor: r.color }} />
              </View>
            </View>
            <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold" }}>{r.amount.toFixed(0)}</Text>
          </Pressable>
        </MotiView>
      ))}
    </View>
  );
}
