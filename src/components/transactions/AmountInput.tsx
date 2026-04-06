import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export function AmountInput({
  value,
  onChange,
  currency,
}: {
  value: string;
  onChange: (v: string) => void;
  currency: CurrencyCode;
}) {
  const { colors } = useTheme();
  const num = parseFloat(value || "0") || 0;
  const press = (k: string) => {
    if (k === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === "." && value.includes(".")) return;
    onChange(value + k);
  };
  return (
    <View>
      <Text
        style={{
          fontFamily: "SpaceGrotesk_700Bold",
          fontSize: 42,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        {formatCurrency(num, currency)}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
        {keys.map((k) => (
          <Pressable
            key={k}
            onPress={() => press(k)}
            style={{
              width: "28%",
              aspectRatio: 1.6,
              borderRadius: 14,
              backgroundColor: colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
            accessibilityLabel={k === "⌫" ? "Backspace" : `Digit ${k}`}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontFamily: "SpaceGrotesk_600SemiBold" }}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
