import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0A0F" } }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="pin-setup" />
      <Stack.Screen name="unlock" />
    </Stack>
  );
}
