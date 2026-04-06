import { useSettingsStore } from "@/store/useSettingsStore";
import type { CurrencyCode } from "@/constants/currencies";

export function useCurrency(): CurrencyCode {
  return useSettingsStore((s) => s.currency);
}
