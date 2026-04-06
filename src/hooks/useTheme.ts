import { useColorScheme } from "react-native";
import { useMemo } from "react";
import {
  accentPalette,
  darkTheme,
  fontScales,
  lightTheme,
  saffronDarkTheme,
  diwaliTheme,
  holiTheme,
  type FontScalePreset,
  type ThemeTokens,
} from "@/constants/theme";
import { useSettingsStore } from "@/store/useSettingsStore";

export function useTheme(): {
  isDark: boolean;
  colors: ThemeTokens;
  fontScale: (typeof fontScales)[FontScalePreset];
} {
  const pref = useSettingsStore((s) => s.theme);
  const accentHex = useSettingsStore((s) => s.accentColor);
  const fontPreset = useSettingsStore((s) => s.fontSizePreset ?? "medium");
  const edition = useSettingsStore((s) => s.edition);
  const system = useColorScheme();
  
  const isDark = useMemo(() => {
    if (pref === "system") return system !== "light";
    return pref === "dark";
  }, [pref, system]);

  const colors = useMemo(() => {
    let base = isDark ? darkTheme : lightTheme;
    
    if (edition === "india") base = saffronDarkTheme;
    else if (edition === "diwali") base = diwaliTheme;
    else if (edition === "holi") base = holiTheme;

    const hit = accentPalette.find((a) => a.primary.toLowerCase() === accentHex.toLowerCase()) ?? accentPalette[0];
    return {
      ...base,
      primary: hit.primary,
      primaryGlow: hit.glow,
      cardGlow: `${hit.light}26`,
    };
  }, [isDark, accentHex, edition]);

  const fontScale = fontScales[fontPreset] ?? fontScales.medium;
  return { isDark, colors, fontScale };
}
