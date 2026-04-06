import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Insight } from "@/types/insight";
import { useTheme } from "@/hooks/useTheme";

export function InsightCard({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  const iconName = (insight.icon ?? "lightbulb-outline") as keyof typeof MaterialCommunityIcons.glyphMap;
  const { colors } = useTheme();
  const tint = insight.color ?? colors.primary;
  const fallback =
    insight.tone === "warning" ? "alert-circle" : insight.tone === "success" ? "check-circle" : "lightbulb-outline";
  const resolved = insight.icon ? iconName : (fallback as keyof typeof MaterialCommunityIcons.glyphMap);
  return (
    <LinearGradient
      colors={[`${tint}55`, "rgba(30,30,46,0.92)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 16, padding: 14, marginBottom: 10 }}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <MaterialCommunityIcons name={resolved} size={22} color={tint} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#F0F0FF", fontFamily: "SpaceGrotesk_600SemiBold" }}>{insight.title}</Text>
          <Text style={{ color: "#8888AA", marginTop: 4, fontSize: 13 }}>{insight.body}</Text>
        </View>
        {insight.dismissible ? (
          <Pressable onPress={onDismiss} accessibilityLabel="Dismiss insight">
            <MaterialCommunityIcons name="close" size={20} color="#8888AA" />
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}
