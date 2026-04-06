import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiPressable } from "moti/interactions";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme } from "@/hooks/useTheme";

const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  index: "home",
  transactions: "format-list-bulleted",
  insights: "chart-areaspline",
  goals: "trophy",
  profile: "account",
};

const labels: Record<string, string> = {
  index: "Home",
  transactions: "Txns",
  insights: "Insights",
  goals: "Goals",
  profile: "Profile",
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { light } = useHaptics();
  const routes = state.routes.filter((r) => r.name !== "+not-found");

  return (
    <View
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 10,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
        {routes.slice(0, 2).map((route) => {
          const isFocused = state.index === state.routes.indexOf(route);
          const onPress = () => {
            light();
            const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !e.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="tab" accessibilityLabel={labels[route.name] ?? route.name} style={{ alignItems: "center", flex: 1 }}>
              <MaterialCommunityIcons name={icons[route.name] ?? "circle"} size={24} color={isFocused ? colors.primary : colors.textSecondary} />
              <Text style={{ color: isFocused ? colors.primary : colors.textSecondary, fontSize: 11, marginTop: 4 }}>{labels[route.name]}</Text>
            </Pressable>
          );
        })}
        <MotiPressable
          onPress={() => {
            light();
            router.push("/modals/add-transaction" as never);
          }}
          animate={({ pressed }) => ({ scale: pressed ? 0.92 : 1 })}
          style={{ marginHorizontal: 8, marginTop: -28 }}
          accessibilityRole="button"
          accessibilityLabel="Add transaction or goal"
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOpacity: 0.45,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }}
          >
            <MaterialCommunityIcons name="plus" size={30} color="#fff" />
          </LinearGradient>
        </MotiPressable>
        {routes.slice(2).map((route) => {
          const isFocused = state.index === state.routes.indexOf(route);
          const onPress = () => {
            light();
            const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !e.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="tab" accessibilityLabel={labels[route.name] ?? route.name} style={{ alignItems: "center", flex: 1 }}>
              <MaterialCommunityIcons name={icons[route.name] ?? "circle"} size={24} color={isFocused ? colors.primary : colors.textSecondary} />
              <Text style={{ color: isFocused ? colors.primary : colors.textSecondary, fontSize: 11, marginTop: 4 }}>{labels[route.name]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
