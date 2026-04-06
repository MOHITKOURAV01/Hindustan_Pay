import type { ViewProps } from "react-native";
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";

export function Card({ style, children, ...rest }: ViewProps) {
  const { isDark, colors } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        style,
      ]}
      {...rest}
    >
      <BlurView
        intensity={isDark ? 28 : 12}
        tint={isDark ? "dark" : "light"}
        style={{ padding: 16 }}
      >
        {children}
      </BlurView>
    </View>
  );
}
