import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHaptics } from "@/hooks/useHaptics";

const LOCKOUT_KEY = "hp_lockout_until";
const FAILS_KEY = "hp_pin_fails";

export default function UnlockScreen() {
  const router = useRouter();
  const verifyPin = useAuthStore((s) => s.verifyPin);
  const hydrated = useAuthStore((s) => s.hydrated);
  const unlock = useAuthStore((s) => s.unlock);
  const biometric = useSettingsStore((s) => s.biometricEnabled);
  const { light, error, success } = useHaptics();
  const [pin, setPin] = useState("");
  const [showPinPad, setShowPinPad] = useState(!biometric);
  const [lockoutUntilSec, setLockoutUntilSec] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const bioAttempted = useRef(false);

  const refreshLockout = useCallback(async () => {
    const raw = await SecureStore.getItemAsync(LOCKOUT_KEY);
    if (!raw) {
      setLockoutUntilSec(null);
      setRemainingSec(0);
      return;
    }
    const until = parseInt(raw, 10);
    if (Number.isNaN(until)) {
      setLockoutUntilSec(null);
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    if (now >= until) {
      await SecureStore.deleteItemAsync(LOCKOUT_KEY);
      await SecureStore.deleteItemAsync(FAILS_KEY);
      setLockoutUntilSec(null);
      setRemainingSec(0);
      return;
    }
    setLockoutUntilSec(until);
    setRemainingSec(until - now);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void useAuthStore.getState().hasPinConfigured().then((ok) => {
      if (!ok) router.replace("/(auth)/onboarding" as never);
    });
  }, [hydrated, router]);

  useEffect(() => {
    void refreshLockout();
  }, [refreshLockout]);

  useEffect(() => {
    if (lockoutUntilSec == null || remainingSec <= 0) return;
    const t = setInterval(() => {
      void refreshLockout();
    }, 1000);
    return () => clearInterval(t);
  }, [lockoutUntilSec, remainingSec, refreshLockout]);

  useEffect(() => {
    if (!biometric || bioAttempted.current) return;
    bioAttempted.current = true;
    void (async () => {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) {
        setShowPinPad(true);
        return;
      }
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Hindustan Pay" });
      if (r.success) {
        await SecureStore.deleteItemAsync(FAILS_KEY);
        await SecureStore.deleteItemAsync(LOCKOUT_KEY);
        success();
        unlock();
        router.replace("/(tabs)");
        return;
      }
      setShowPinPad(true);
    })();
  }, [biometric, router, unlock, success]);

  const append = (d: string) => {
    if (lockoutUntilSec != null && remainingSec > 0) return;
    if (pin.length >= 6) return;
    light();
    setPin((p) => p + d);
  };

  const back = () => setPin((p) => p.slice(0, -1));

  const tryUnlock = useCallback(async () => {
    if (pin.length !== 6) return;
    await refreshLockout();
    const raw = await SecureStore.getItemAsync(LOCKOUT_KEY);
    const until = raw ? parseInt(raw, 10) : 0;
    const now = Math.floor(Date.now() / 1000);
    if (raw && !Number.isNaN(until) && now < until) {
      error();
      setPin("");
      return;
    }
    const ok = await verifyPin(pin);
    if (ok) {
      await SecureStore.deleteItemAsync(FAILS_KEY);
      await SecureStore.deleteItemAsync(LOCKOUT_KEY);
      success();
      router.replace("/(tabs)");
    } else {
      error();
      setPin("");
      const failsRaw = await SecureStore.getItemAsync(FAILS_KEY);
      let n = failsRaw ? parseInt(failsRaw, 10) : 0;
      if (Number.isNaN(n)) n = 0;
      n += 1;
      if (n >= 5) {
        const lockUntil = Math.floor(Date.now() / 1000) + 30;
        await SecureStore.setItemAsync(LOCKOUT_KEY, String(lockUntil));
        await SecureStore.deleteItemAsync(FAILS_KEY);
        setLockoutUntilSec(lockUntil);
        setRemainingSec(30);
      } else {
        await SecureStore.setItemAsync(FAILS_KEY, String(n));
      }
    }
  }, [pin, verifyPin, router, error, success, refreshLockout]);

  useEffect(() => {
    if (pin.length === 6) {
      void tryUnlock();
    }
  }, [pin, tryUnlock]);

  const lockedOut = lockoutUntilSec != null && remainingSec > 0;

  return (
    <LinearGradient colors={["#0A0A0F", "#1E1E2E"]} style={{ flex: 1, padding: 24, paddingTop: 72 }}>
      <LottieView source={require("../../assets/lottie/loading.json")} autoPlay loop style={{ width: 160, height: 160, alignSelf: "center" }} />
      <Text style={{ color: "#F0F0FF", fontFamily: "SpaceGrotesk_700Bold", fontSize: 24, textAlign: "center", marginTop: 12 }}>Welcome back</Text>
      <Text style={{ color: "#8888AA", textAlign: "center", marginTop: 8 }}>
        {biometric && !showPinPad ? "Authenticating…" : "Enter your PIN"}
      </Text>
      {biometric && showPinPad ? (
        <Pressable
          onPress={() => {
            light();
            void (async () => {
              const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Hindustan Pay" });
              if (r.success) {
                await SecureStore.deleteItemAsync(FAILS_KEY);
                await SecureStore.deleteItemAsync(LOCKOUT_KEY);
                success();
                unlock();
                router.replace("/(tabs)");
              }
            })();
          }}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: "#6C63FF", textAlign: "center", fontFamily: "Inter_500Medium" }}>Try Face ID / Fingerprint</Text>
        </Pressable>
      ) : null}
      {lockedOut ? (
        <View style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: "rgba(255,92,92,0.12)" }}>
          <Text style={{ color: "#FF5C5C", textAlign: "center", fontFamily: "SpaceGrotesk_600SemiBold" }}>Too many attempts</Text>
          <Text style={{ color: "#8888AA", textAlign: "center", marginTop: 8 }}>Try again in {remainingSec}s</Text>
        </View>
      ) : null}
      {showPinPad && !lockedOut ? (
        <>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginVertical: 28 }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: idx < pin.length ? "#00D4AA" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, idx) =>
              k === "" ? (
                <View key={idx} style={{ width: "28%", aspectRatio: 1.2 }} />
              ) : (
                <Pressable
                  key={idx}
                  onPress={() => (k === "⌫" ? back() : append(k))}
                  style={{
                    width: "28%",
                    aspectRatio: 1.2,
                    borderRadius: 16,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#F0F0FF", fontSize: 22, fontFamily: "SpaceGrotesk_600SemiBold" }}>{k}</Text>
                </Pressable>
              ),
            )}
          </View>
        </>
      ) : null}
    </LinearGradient>
  );
}
