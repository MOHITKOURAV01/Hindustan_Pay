import { useSettingsStore } from "@/store/useSettingsStore";
import { LOCALIZATION, type LocalizationKey } from "@/constants/localization";

export function useStrings() {
  const language = useSettingsStore((s) => s.language) || "en";
  
  const t = (key: LocalizationKey): string => {
    return (LOCALIZATION[language] as any)[key] || (LOCALIZATION["en"] as any)[key] || key;
  };

  return { t, language };
}
