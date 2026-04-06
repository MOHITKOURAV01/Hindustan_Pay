import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hasOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const unlocked = useAuthStore((s) => s.isUnlocked);
  const [ready, setReady] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    void useAuthStore
      .getState()
      .hasPinConfigured()
      .then((v) => {
        setHasPin(v);
        setReady(true);
      });
  }, [hydrated]);

  if (!hydrated || !ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0A0F" }}>
        <ActivityIndicator color="#6C63FF" />
      </View>
    );
  }
  if (!hasOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }
  if (!hasPin) {
    return <Redirect href="/(auth)/pin-setup" />;
  }
  if (!unlocked) {
    return <Redirect href="/(auth)/unlock" />;
  }
  return <Redirect href="/(tabs)" />;
}
