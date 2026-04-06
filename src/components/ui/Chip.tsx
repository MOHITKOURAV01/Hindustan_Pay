import { Pressable, Text } from "react-native";
import { MotiView } from "moti";
import { useHaptics } from "@/hooks/useHaptics";
import { radius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { light } = useHaptics();
  return (
    <Pressable
      onPress={() => {
        light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MotiView
        animate={{
          scale: selected ? 1.02 : 1,
          backgroundColor: selected ? `${colors.primary}59` : colors.surfaceElevated,
        }}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
        }}
      >
        <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 13 }}>{label}</Text>
      </MotiView>
    </Pressable>
  );
}
