import { useCallback, useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import LottieView from "lottie-react-native";
import ViewShot from "react-native-view-shot";
import type { Goal } from "@/types/goal";
import type { CurrencyCode } from "@/constants/currencies";
import { formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@/components/ui/Button";

type Props = {
  visible: boolean;
  goal: Goal | null;
  currency: CurrencyCode;
  onClose: () => void;
};

export function GoalCompletionCelebration({ visible, goal, currency, onClose }: Props) {
  const shotRef = useRef<InstanceType<typeof ViewShot> | null>(null);

  const runHaptics = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const onShare = useCallback(async () => {
    try {
      const ref = shotRef.current;
      const uri = ref && ref.capture ? await ref.capture() : undefined;
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { dialogTitle: "Share achievement" });
      }
    } catch {
      /* noop */
    }
  }, []);

  if (!goal) return null;

  const days = Math.max(1, Math.ceil((Date.now() - goal.createdAt) / 86400000));

  return (
    <Modal visible={visible} animationType="fade" transparent onShow={() => void runHaptics()}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
        <LottieView
          source={require("../../../assets/lottie/confetti.json")}
          autoPlay
          loop
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <ViewShot ref={shotRef} options={{ format: "png", quality: 0.92 }}>
          <View
            style={{
              marginHorizontal: 24,
              padding: 28,
              borderRadius: 24,
              backgroundColor: "#1A1A27",
              borderWidth: 1,
              borderColor: "#6C63FF55",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 56 }}>{goal.emoji ?? "🎯"}</Text>
            <Text style={{ color: "#F0F0FF", fontFamily: "SpaceGrotesk_700Bold", fontSize: 24, marginTop: 12 }}>Goal Achieved!</Text>
            <Text style={{ color: "#6C63FF", fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, marginTop: 8 }}>{goal.title}</Text>
            <Text style={{ color: "#8888AA", textAlign: "center", marginTop: 12, fontSize: 15 }}>
              You saved {formatCurrency(goal.targetAmount, currency)} for {goal.title}!
            </Text>
            <Text style={{ color: "#8888AA", marginTop: 8 }}>Completed in {days} days</Text>
            <View style={{ marginTop: 24, width: "100%", gap: 10 }}>
              <Button title="Share Achievement" onPress={onShare} />
              <Button variant="ghost" title="Continue" onPress={onClose} />
            </View>
          </View>
        </ViewShot>
        <Pressable onPress={onClose} style={{ position: "absolute", top: 56, right: 24 }}>
          <Text style={{ color: "#8888AA", fontSize: 16 }}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
