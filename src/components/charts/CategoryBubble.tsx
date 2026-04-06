import { ScrollView, Text, View } from "react-native";
import { MotiView } from "moti";
import { useTheme } from "@/hooks/useTheme";

export function CategoryBubble({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const { colors } = useTheme();
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
      {items.map((item, i) => (
        <MotiView
          key={item.label}
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 40 }}
          style={{
            minWidth: 72 + (item.value / max) * 40,
            minHeight: 72 + (item.value / max) * 40,
            borderRadius: 999,
            backgroundColor: item.color + "33",
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            padding: 10,
          }}
        >
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 12 }} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{item.value.toFixed(0)}</Text>
        </MotiView>
      ))}
    </ScrollView>
  );
}
