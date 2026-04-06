import type { TextProps } from "react-native";
import { Text } from "react-native";
import { typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

type Variant = keyof typeof typography;

export function Typography({
  variant = "body",
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  const { colors, fontScale } = useTheme();
  const base = typography[variant];
  const fontSize =
    variant === "display"
      ? fontScale.display
      : variant === "h1"
        ? fontScale.heading + 4
        : variant === "h2"
          ? fontScale.heading
          : variant === "caption"
            ? fontScale.caption
            : variant === "amount"
              ? fontScale.heading + 2
              : fontScale.body;
  return (
    <Text
      style={[
        base,
        { fontSize, color: color ?? colors.textPrimary },
        style,
      ]}
      {...rest}
    />
  );
}
