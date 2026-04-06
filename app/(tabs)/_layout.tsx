import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/navigation/CustomTabBar";
import { useRecurringOnForeground } from "@/hooks/useRecurringOnForeground";

export default function TabsLayout() {
  useRecurringOnForeground();
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="goals" options={{ title: "Goals" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
