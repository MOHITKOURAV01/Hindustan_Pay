import { MotiPressable } from "moti/interactions";
import type { TextStyle, ViewStyle } from "react-native";
import { ActivityIndicator, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useHaptics } from "@/hooks/useHaptics";
import { accentPalette, radius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  textStyle,
}: Props) {
  const { light } = useHaptics();
  const { colors } = useTheme();
  const accentLight = accentPalette.find((a) => a.primary.toLowerCase() === colors.primary.toLowerCase())?.light ?? "#8B84FF";
  if (variant === "primary") {
    return (
      <MotiPressable
        onPress={() => {
          if (disabled || loading) return;
          light();
          onPress();
        }}
        animate={({ pressed }) => ({
          scale: pressed ? 0.96 : 1,
        })}
        disabled={disabled || loading}
        style={[{ borderRadius: radius.md, overflow: "hidden", opacity: disabled || loading ? 0.5 : 1 }, style]}
      >
        <LinearGradient
          colors={[colors.primary, accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 14, paddingHorizontal: 20, alignItems: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[{ color: "#fff", fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16 }, textStyle]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </MotiPressable>
    );
  }
  return (
    <MotiPressable
      disabled={disabled || loading}
      onPress={() => {
        if (disabled || loading) return;
        light();
        onPress();
      }}
      animate={({ pressed }) => ({ scale: pressed ? 0.96 : 1 })}
      style={[
        {
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: radius.md,
          backgroundColor: variant === "danger" ? "rgba(255,92,92,0.15)" : "rgba(255,255,255,0.06)",
          opacity: disabled || loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: variant === "danger" ? "#FF5C5C" : "#F0F0FF",
            fontFamily: "Inter_500Medium",
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </MotiPressable>
  );
}
