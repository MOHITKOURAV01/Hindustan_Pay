import { ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiPressable } from "moti/interactions";
import { useRouter } from "expo-router";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";

const actions = [
  { key: "income", label: "Add Income", icon: "trending-up", route: "/modals/add-transaction?type=income" as const },
  { key: "expense", label: "Add Expense", icon: "trending-down", route: "/modals/add-transaction?type=expense" as const },
  { key: "transfer", label: "Transfer", icon: "bank-transfer", route: "/modals/add-transaction" as const },
  { key: "goals", label: "Goals", icon: "trophy", route: "/(tabs)/goals" as const },
];

export function QuickActions() {
  const router = useRouter();
  const { light } = useHaptics();
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
      {actions.map((a) => (
        <MotiPressable
          key={a.key}
          onPress={() => {
            light();
            router.push(a.route as never);
          }}
          animate={({ pressed }) => ({ scale: pressed ? 0.96 : 1 })}
          style={{ alignItems: "center", width: 88 }}
          accessibilityRole="button"
          accessibilityLabel={a.label}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name={a.icon as never} size={26} color="#fff" />
          </LinearGradient>
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12, textAlign: "center" }}>{a.label}</Text>
        </MotiPressable>
      ))}
    </ScrollView>
  );
}
