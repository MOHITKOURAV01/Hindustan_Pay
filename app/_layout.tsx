import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import * as SplashScreen from "expo-splash-screen";
import { initDatabase } from "@/db/init";
import { runMigrations } from "@/db/migrate";
import { seedDatabaseIfEmpty } from "@/db/seed";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useGoalStore } from "@/store/useGoalStore";
import { useInsightStore } from "@/store/useInsightStore";
import { initErrorTracking } from "@/utils/errorTracking";
import { useLockTimer } from "@/hooks/useLockTimer";
import { ToastHost } from "@/components/ui/Toast";
import { registerBudgetBackgroundFetch } from "@/utils/notifications";
import { Analytics } from "@/utils/analytics";
import * as Linking from "expo-linking";
import { AppState, type AppStateStatus } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useLockTimer();
  const [loaded, err] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    initErrorTracking();
    initDatabase();
    void runMigrations();
    seedDatabaseIfEmpty();
    useCategoryStore.getState().loadCategories();
    useTransactionStore.getState().loadTransactions();
    useGoalStore.getState().loadGoals();
    void useInsightStore.getState().calculateInsights();
    Analytics.track("app_open", { platform: "ios", version: "1.0.0" });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        Analytics.track("app_open", { trigger: "foreground" });
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const { path, queryParams } = Linking.parse(url);
      console.log("[DeepLink] Received:", path, queryParams);
    };
    const sub = Linking.addEventListener("url", (e: { url: string }) => handleUrl(e.url));
    void Linking.getInitialURL().then((url: string | null) => {
      handleUrl(url);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    void registerBudgetBackgroundFetch();
  }, []);

  useEffect(() => {
    if (loaded || err) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, err]);

  if (!loaded && !err) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "#0A0A0F" }} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0A0F" } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modals" options={{ presentation: "modal" }} />
        </Stack>
        <ToastHost />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
