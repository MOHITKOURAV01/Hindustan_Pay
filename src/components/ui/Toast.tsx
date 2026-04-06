import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { MotiView } from "moti";
import { create } from "zustand";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastPayload = {
  message: string;
  variant: ToastVariant;
  duration?: number;
};

type ToastState = {
  visible: boolean;
  payload: ToastPayload | null;
  show: (p: ToastPayload) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  payload: null,
  show: (payload) => set({ visible: true, payload }),
  hide: () => set({ visible: false, payload: null }),
}));

export function useToast() {
  const show = useToastStore((s) => s.show);
  return {
    showToast: (opts: ToastPayload) => show(opts),
  };
}

const colors: Record<ToastVariant, { bg: string; border: string; text: string }> = {
  success: { bg: "rgba(76,175,130,0.95)", border: "#4CAF82", text: "#0A1F14" },
  error: { bg: "rgba(255,92,92,0.95)", border: "#FF5C5C", text: "#1A0A0A" },
  warning: { bg: "rgba(255,179,71,0.95)", border: "#FFB347", text: "#1A1408" },
  info: { bg: "rgba(108,99,255,0.95)", border: "#6C63FF", text: "#F0F0FF" },
};

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useTheme();
  const visible = useToastStore((s) => s.visible);
  const payload = useToastStore((s) => s.payload);
  const hide = useToastStore((s) => s.hide);

  useEffect(() => {
    if (!visible || !payload) return;
    const ms = payload.duration ?? 3000;
    const t = setTimeout(() => hide(), ms);
    return () => clearTimeout(t);
  }, [visible, payload, hide]);

  if (!visible || !payload) return null;

  const c = colors[payload.variant];

  return (
    <MotiView
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12) + 56,
        zIndex: 9999,
      }}
      from={{ opacity: 0, translateY: 24 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 220 }}
    >
      <Pressable onPress={hide}>
        <MotiView
          style={{
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 14,
            backgroundColor: payload.variant === "info" ? c.bg : c.bg,
            borderWidth: 1,
            borderColor: c.border,
            shadowColor: theme.primary,
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text style={{ color: c.text, fontFamily: "Inter_500Medium", fontSize: 15 }}>{payload.message}</Text>
        </MotiView>
      </Pressable>
    </MotiView>
  );
}
