import type { TextInputProps } from "react-native";
import { TextInput, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";
import { Typography } from "./Typography";

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? (
        <Typography variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
          {label}
        </Typography>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? "#FF5C5C" : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: colors.textPrimary,
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            backgroundColor: colors.surface,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Typography variant="caption" color="#FF5C5C" style={{ marginTop: 4 }}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}
