import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";

export type DateTimePickerModalProps = {
  isVisible: boolean;
  mode: "date" | "time" | "datetime";
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
};

export function DateTimePickerModal({
  isVisible,
  mode,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  title,
}: DateTimePickerModalProps) {
  const { colors, isDark } = useTheme();
  const [inner, setInner] = useState(value);
  const [androidStep, setAndroidStep] = useState<"date" | "time">("date");

  useEffect(() => {
    if (isVisible) {
      setInner(value);
      setAndroidStep("date");
    }
  }, [isVisible, value]);

  if (!isVisible) return null;

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
  };

  if (Platform.OS === "android") {
    if (mode === "datetime") {
      if (androidStep === "date") {
        return (
          <DateTimePicker
            value={inner}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(e: DateTimePickerEvent, d?: Date) => {
              if (e.type === "dismissed") {
                onCancel();
                return;
              }
              if (e.type === "set" && d) {
                setInner(d);
                setAndroidStep("time");
              }
            }}
          />
        );
      }
      return (
        <DateTimePicker
          value={inner}
          mode="time"
          display="default"
          onChange={(e: DateTimePickerEvent, d?: Date) => {
            if (e.type === "dismissed") {
              onCancel();
              return;
            }
            if (e.type === "set" && d) {
              const merged = new Date(inner);
              merged.setHours(d.getHours(), d.getMinutes(), 0, 0);
              onConfirm(merged);
            }
          }}
        />
      );
    }

    return (
      <DateTimePicker
        value={inner}
        mode={mode === "date" ? "date" : "time"}
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(e: DateTimePickerEvent, d?: Date) => {
          if (e.type === "dismissed") {
            onCancel();
            return;
          }
          if (e.type === "set" && d) onConfirm(d);
        }}
      />
    );
  }

  const iosMode = mode === "datetime" ? "datetime" : mode;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={{ flex: 1 }} />
        </Pressable>
        <View style={cardStyle}>
          {title ? (
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: "SpaceGrotesk_600SemiBold",
                fontSize: 17,
                marginBottom: 8,
              }}
            >
              {title}
            </Text>
          ) : null}
          <DateTimePicker
            value={inner}
            mode={iosMode}
            display="spinner"
            themeVariant={isDark ? "dark" : "light"}
            onChange={(_, d) => {
              if (d) setInner(d);
            }}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
              paddingHorizontal: 4,
            }}
          >
            <Pressable onPress={onCancel} accessibilityRole="button">
              <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 17 }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => onConfirm(inner)} accessibilityRole="button">
              <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", fontSize: 17 }}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
