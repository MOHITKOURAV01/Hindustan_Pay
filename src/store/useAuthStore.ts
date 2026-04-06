import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { hashPIN, verifyPIN } from "@/utils/security";

const PIN_HASH_KEY = "hp_pin_hash";
const PIN_SET_KEY = "hp_pin_configured";
const PIN_FAILS_KEY = "hp_pin_fails";
const LOCKOUT_UNTIL_KEY = "hp_lockout_until";

export type UserProfile = {
  name: string;
  memberSince: string;
  avatarColor: number;
};

type AuthState = {
  hydrated: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isUnlocked: boolean;
  userProfile: UserProfile;
  setHydrated: (v: boolean) => void;
  completeOnboarding: () => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  hasPinConfigured: () => Promise<boolean>;
  authenticate: () => void;
  unlock: () => void;
  lock: () => void;
  logout: () => void;
  logoutSoft: () => void;
  updateProfile: (p: Partial<UserProfile>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      isUnlocked: false,
      userProfile: {
        name: "Mohit",
        memberSince: "April 2026",
        avatarColor: 260,
      },
      setHydrated: (v) => set({ hydrated: v }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setPin: async (pin) => {
        const hash = await hashPIN(pin);
        await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
        await SecureStore.setItemAsync(PIN_SET_KEY, "1");
        await SecureStore.deleteItemAsync(PIN_FAILS_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY).catch(() => {});
        set({ isUnlocked: true, isAuthenticated: true });
      },
      verifyPin: async (pin) => {
        const lockoutRaw = await SecureStore.getItemAsync(LOCKOUT_UNTIL_KEY);
        if (lockoutRaw) {
          const until = parseInt(lockoutRaw, 10);
          if (Date.now() < until) return false;
        }

        const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
        if (!stored) return false;
        const ok = await verifyPIN(pin, stored);
        if (ok) {
          await SecureStore.deleteItemAsync(PIN_FAILS_KEY).catch(() => {});
          await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY).catch(() => {});
          set({ isUnlocked: true, isAuthenticated: true });
        } else {
          const failsRaw = await SecureStore.getItemAsync(PIN_FAILS_KEY);
          const fails = (parseInt(failsRaw || "0", 10)) + 1;
          await SecureStore.setItemAsync(PIN_FAILS_KEY, String(fails));
          if (fails >= 5) {
            const until = Date.now() + 30 * 1000;
            await SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, String(until));
          }
        }
        return ok;
      },
      hasPinConfigured: async () => {
        const v = await SecureStore.getItemAsync(PIN_SET_KEY);
        return v === "1";
      },
      authenticate: () => set({ isAuthenticated: true, isUnlocked: true }),
      unlock: () => set({ isUnlocked: true, isAuthenticated: true }),
      lock: () => set({ isUnlocked: false }),
      logout: () => set({ isAuthenticated: false, isUnlocked: false }),
      logoutSoft: () => set({ isUnlocked: false }),
      updateProfile: (p) =>
        set({ userProfile: { ...get().userProfile, ...p } }),
    }),
    {
      name: "hp-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        hasCompletedOnboarding: s.hasCompletedOnboarding,
        userProfile: s.userProfile,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.getState().setHydrated(true);
      },
    },
  ),
);
