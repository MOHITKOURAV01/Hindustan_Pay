import { Text, View } from "react-native";
import { MotiView } from "moti";
import { Chip } from "@/components/ui/Chip";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";

export function SpendingPulse({
  todayTotal,
  chips,
  currency,
}: {
  todayTotal: number;
  chips: { label: string }[];
  currency: CurrencyCode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderRadius: 16,
        padding: 14,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <MotiView
        from={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ loop: true, type: "timing", duration: 1400 }}
      >
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16 }}>
          Today: {formatCurrency(todayTotal, currency)} spent
        </Text>
      </MotiView>
      <View style={{ height: 6, borderRadius: 4, backgroundColor: colors.border, marginTop: 10, overflow: "hidden" }}>
        <MotiView
          from={{ width: "40%" }}
          animate={{ width: "92%" }}
          transition={{ loop: true, type: "timing", duration: 1800 }}
          style={{ height: "100%", backgroundColor: colors.accent }}
        />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {chips.map((c) => (
          <Chip key={c.label} label={c.label} selected={false} onPress={() => {}} />
        ))}
      </View>
    </View>
  );
}
