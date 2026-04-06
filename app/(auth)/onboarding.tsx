import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/useAuthStore";
import { useHaptics } from "@/hooks/useHaptics";
import { Button } from "@/components/ui/Button";

const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Know Your Money",
    subtitle: "See balances, cash flow, and habits in one calm dashboard.\nApna paisa samjho",
    lottie: require("../../assets/lottie/loading.json"),
  },
  {
    title: "Track Everything",
    subtitle: "Log income and expenses in seconds with rich categories.",
    lottie: require("../../assets/lottie/success.json"),
  },
  {
    title: "Reach Your Goals",
    subtitle: "Savings targets, streaks, and challenges that feel rewarding.",
    lottie: require("../../assets/lottie/confetti.json"),
  },
  {
    title: "Smart Insights",
    subtitle: "Charts and nudges that explain where your money goes.",
    lottie: require("../../assets/lottie/loading.json"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const complete = useAuthStore((s) => s.completeOnboarding);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const hydrated = useAuthStore((s) => s.hydrated);
  const { light } = useHaptics();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (hasCompletedOnboarding) {
      router.replace("/(auth)/unlock" as never);
    }
  }, [hydrated, hasCompletedOnboarding, router]);
  const pager = useRef<LottieView>(null);
  const startX = useRef(0);

  const goNext = () => {
    light();
    if (i < slides.length - 1) {
      setI((x) => x + 1);
    } else {
      complete();
      router.replace("/(auth)/pin-setup");
    }
  };

  const goPrev = () => {
    light();
    if (i > 0) setI((x) => x - 1);
  };

  const skip = () => {
    light();
    setI(slides.length - 1);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => {
      startX.current = e.absoluteX;
    })
    .onEnd((e) => {
      const dx = e.absoluteX - startX.current;
      if (dx < -48) goNext();
      else if (dx > 48) goPrev();
    });

  const s = slides[i];

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A27", "#12121A"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 56, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
          {i < slides.length - 1 ? (
            <Pressable onPress={skip} accessibilityLabel="Skip onboarding">
              <Text style={{ color: "#6C63FF", fontFamily: "Inter_500Medium" }}>Skip</Text>
            </Pressable>
          ) : (
            <View style={{ height: 22 }} />
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {slides.map((_, idx) => (
            <MotiView
              key={idx}
              animate={{
                width: idx === i ? 28 : 8,
                height: 8,
                borderRadius: idx === i ? 4 : 4,
                opacity: idx === i ? 1 : 0.35,
              }}
              style={{ backgroundColor: "#6C63FF" }}
            />
          ))}
        </View>
        <GestureDetector gesture={pan}>
          <View style={{ flex: 1 }}>
            <MotiView key={i} from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }} style={{ alignItems: "center" }}>
              <LottieView ref={pager} source={s.lottie} autoPlay loop style={{ width: 300, height: 300 }} />
              <Text style={{ color: "#F0F0FF", fontFamily: "SpaceGrotesk_700Bold", fontSize: 28, textAlign: "center", marginTop: 8 }}>{s.title}</Text>
              <Text style={{ color: "#8888AA", fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", marginTop: 12, maxWidth: width - 48 }}>
                {s.subtitle}
              </Text>
            </MotiView>
          </View>
        </GestureDetector>
        <View style={{ flex: 1 }} />
        {i < slides.length - 1 ? (
          <Button title="Next" onPress={goNext} />
        ) : (
          <Button title="Shuru Karein" onPress={goNext} />
        )}
        <Text style={{ color: "#8888AA", textAlign: "center", marginTop: 12, marginBottom: 8 }}>Swipe left or right to navigate</Text>
      </View>
    </LinearGradient>
  );
}
