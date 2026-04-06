import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";

const BG_AT_KEY = "hp_bg_at";

function timeoutSecondsFromPreset(preset: "immediate" | "1m" | "5m" | "15m"): number {
  switch (preset) {
    case "immediate":
      return 0;
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    default:
      return 300;
  }
}

export function useLockTimer() {
  const appState = useRef(AppState.currentState);
  const preset = useSettingsStore((s) => s.appLockTimeout);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;
      const sec = timeoutSecondsFromPreset(preset);

      if (prev.match(/active|foreground/) && next.match(/inactive|background/)) {
        if (sec === 0) {
          useAuthStore.getState().lock();
        } else {
          void SecureStore.setItemAsync(BG_AT_KEY, String(Date.now()));
        }
      }

      if (prev.match(/inactive|background/) && next === "active") {
        void (async () => {
          if (sec === 0) {
            return;
          }
          const raw = await SecureStore.getItemAsync(BG_AT_KEY);
          await SecureStore.deleteItemAsync(BG_AT_KEY);
          if (!raw) return;
          const bgAt = parseInt(raw, 10);
          if (Number.isNaN(bgAt)) return;
          const elapsedSec = (Date.now() - bgAt) / 1000;
          if (elapsedSec >= sec) {
            useAuthStore.getState().lock();
          }
        })();
      }
    });
    return () => sub.remove();
  }, [preset]);
}
