import { Pressable, Text, View } from "react-native";
import LottieView from "lottie-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  lottieSource,
  icon,
  iconColor,
  title,
  subtitle,
  actionLabel,
  onAction,
  compact,
}: {
  lottieSource?: unknown;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const ic = iconColor ?? colors.primary;
  const pad = compact ? 16 : 24;
  return (
    <View style={{ alignItems: "center", paddingVertical: pad, paddingHorizontal: pad }}>
      {lottieSource ? (
        <LottieView source={lottieSource as never} autoPlay loop style={{ width: compact ? 120 : 160, height: compact ? 120 : 160 }} />
      ) : icon ? (
        <View
          style={{
            width: compact ? 48 : 64,
            height: compact ? 48 : 64,
            borderRadius: compact ? 24 : 32,
            backgroundColor: ic + "22",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name={icon} size={compact ? 26 : 34} color={ic} />
        </View>
      ) : null}
      <Text
        style={{
          color: colors.textPrimary,
          fontFamily: "SpaceGrotesk_600SemiBold",
          fontSize: compact ? 15 : 18,
          marginTop: 12,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: "center", fontSize: compact ? 12 : 14 }}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: compact ? 12 : 20, width: "100%", maxWidth: 280 }}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
