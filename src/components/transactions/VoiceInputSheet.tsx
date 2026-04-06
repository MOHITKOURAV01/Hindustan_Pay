import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";

export type VoiceInputSheetRef = {
  present: () => void;
  close: () => void;
};

type Props = {
  onResult: (text: string) => void;
};

const STUB_RESULTS = [
  "Paid for lunch at Haldiram's",
  "Petrol refill at Indian Oil",
  "Electricity bill for March",
  "Bought groceries from BigBasket",
  "Sent money to Mom for medicines",
];

export const VoiceInputSheet = forwardRef<VoiceInputSheetRef, Props>(({ onResult }, ref) => {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [status, setStatus] = useState<"idle" | "listening" | "processing">("idle");

  useImperativeHandle(ref, () => ({
    present: () => {
      setStatus("listening");
      bottomSheetRef.current?.expand();

      // Simulate listening and processing
      setTimeout(() => {
        setStatus("processing");
        setTimeout(() => {
          const result = STUB_RESULTS[Math.floor(Math.random() * STUB_RESULTS.length)];
          onResult(result);
          bottomSheetRef.current?.close();
          setStatus("idle");
        }, 1500);
      }, 3000);
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  const renderBackdrop = React.useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["40%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {status === "listening" ? "Listening..." : "Processing Voice..."}
        </Text>

        <View style={styles.animationContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Talk naturally to add notes
        </Text>

        <Pressable
          onPress={() => bottomSheetRef.current?.close()}
          style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: 24,
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  animationContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: 200,
    height: 100,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_Regular",
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: 20,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
});
