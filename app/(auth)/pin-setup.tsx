import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { MotiView } from "moti";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHaptics } from "@/hooks/useHaptics";
import { Button } from "@/components/ui/Button";

export default function PinSetupScreen() {
  const router = useRouter();
  const persistPin = useAuthStore((s) => s.setPin);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setBio = useSettingsStore((s) => s.setBiometricEnabled);
  const { light, success, error } = useHaptics();
  const [pin, setPinDigits] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [first, setFirst] = useState("");
  const [phase, setPhase] = useState<"pin" | "bio">("pin");
  const [mismatch, setMismatch] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    void useAuthStore.getState().hasPinConfigured().then((ok) => {
      if (ok) router.replace("/" as never);
    });
  }, [hydrated, router]);

  const append = (d: string) => {
    if (pin.length >= 6) return;
    light();
    setPinDigits((p) => p + d);
    setMismatch(false);
  };

  const back = () => {
    light();
    setPinDigits((p) => p.slice(0, -1));
    setMismatch(false);
  };

  const submit = async () => {
    if (pin.length !== 6) return;
    if (step === "enter") {
      setFirst(pin);
      setPinDigits("");
      setStep("confirm");
      return;
    }
    if (pin !== first) {
      error();
      setShakeKey((k) => k + 1);
      setMismatch(true);
      setPinDigits("");
      setStep("enter");
      setFirst("");
      return;
    }
    await persistPin(pin);
    success();
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (hasHardware && enrolled) {
      setPhase("bio");
    } else {
      router.replace("/(tabs)");
    }
  };

  const skipBio = () => {
    light();
    router.replace("/(tabs)");
  };

  const acceptBio = async () => {
    light();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      skipBio();
      return;
    }
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: "Enable Face ID / Fingerprint for Hindustan Pay",
    });
    setBio(r.success);
    if (r.success) success();
    router.replace("/(tabs)");
  };

  if (phase === "bio") {
    return (
      <LinearGradient colors={["#0A0A0F", "#12121A"]} style={{ flex: 1, padding: 24, paddingTop: 80 }}>
        <Text style={{ color: "#F0F0FF", fontFamily: "SpaceGrotesk_700Bold", fontSize: 26 }}>Biometric unlock</Text>
        <Text style={{ color: "#8888AA", marginTop: 8 }}>
          Enable Face ID / Fingerprint to unlock the app faster?
        </Text>
        <View
          style={{
            marginTop: 32,
            padding: 20,
            borderRadius: 20,
            backgroundColor: "rgba(108,99,255,0.12)",
            borderWidth: 1,
            borderColor: "rgba(108,99,255,0.35)",
          }}
        >
          <Text style={{ color: "#F0F0FF", fontFamily: "Inter_500Medium" }}>
            You can change this anytime in Profile → Security.
          </Text>
        </View>
        <View style={{ marginTop: 32, gap: 12 }}>
          <Button title="Yes, enable" onPress={acceptBio} />
          <Button variant="ghost" title="Skip" onPress={skipBio} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A0F", "#12121A"]} style={{ flex: 1, padding: 24, paddingTop: 80 }}>
      <Text style={{ color: "#F0F0FF", fontFamily: "SpaceGrotesk_700Bold", fontSize: 26 }}>
        {step === "enter" ? "Create your Hindustan Pay PIN" : "Confirm PIN"}
      </Text>
      <Text style={{ color: "#8888AA", marginTop: 8 }}>
        {step === "enter" ? "Choose a 6-digit PIN" : "Re-enter the same PIN"}
      </Text>
      {mismatch ? (
        <Text style={{ color: "#FF5C5C", marginTop: 12, fontFamily: "Inter_500Medium" }}>PINs don&apos;t match</Text>
      ) : null}
      <MotiView
        key={shakeKey}
        animate={{ translateX: shakeKey > 0 ? [0, -12, 12, -12, 12, 0] : 0 }}
        transition={{ type: "timing", duration: 450 }}
        style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginVertical: 32 }}
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <View
            key={idx}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: idx < pin.length ? "#6C63FF" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </MotiView>
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
      <View style={{ marginTop: 24 }}>
        <Button title={step === "enter" ? "Continue" : "Save PIN"} onPress={submit} disabled={pin.length !== 6} />
      </View>
    </LinearGradient>
  );
}
