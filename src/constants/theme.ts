import type { TextStyle, ViewStyle } from "react-native";

/** Default accent preset key for new installs. */
export const defaultAccentKey = "saffron" as const;

export const darkTheme = {
  background: "#0A0A0F",
  surface: "#12121A",
  surfaceElevated: "#1A1A27",
  card: "#1E1E2E",
  glass: "rgba(255,255,255,0.05)",
  primary: "#6C63FF",
  primaryGlow: "rgba(108, 99, 255, 0.3)",
  secondary: "#00D4AA",
  accent: "#FF6B9D",
  warning: "#FFB347",
  error: "#FF5C5C",
  success: "#4CAF82",
  textPrimary: "#F0F0FF",
  textSecondary: "#8888AA",
  border: "rgba(255,255,255,0.08)",
  cardGlow: "rgba(108, 99, 255, 0.15)",
};

export const lightTheme = {
  background: "#F5F5FF",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  card: "#FFFFFF",
  glass: "rgba(26, 26, 46, 0.06)",
  primary: "#6C63FF",
  primaryGlow: "rgba(108, 99, 255, 0.2)",
  secondary: "#00D4AA",
  accent: "#FF6B9D",
  warning: "#FFB347",
  error: "#FF5C5C",
  success: "#4CAF82",
  textPrimary: "#1A1A2E",
  textSecondary: "#5C5C7A",
  border: "rgba(26, 26, 46, 0.12)",
  cardGlow: "rgba(108, 99, 255, 0.12)",
};

export type ThemeTokens = typeof darkTheme;

/** India Edition — dark saffron / tricolor-inspired tokens. */
export const saffronDarkTheme: ThemeTokens = {
  background: "#0D0800",
  surface: "#1A1000",
  surfaceElevated: "#251800",
  card: "#2A1E00",
  glass: "rgba(255,107,0,0.08)",
  primary: "#FF6B00",
  primaryGlow: "rgba(255,107,0,0.3)",
  secondary: "#00A86B",
  accent: "#FFFFFF",
  warning: "#FFB347",
  error: "#FF5C5C",
  success: "#4CAF82",
  textPrimary: "#FFF8F0",
  textSecondary: "#CC9966",
  border: "rgba(255,107,0,0.15)",
  cardGlow: "rgba(255,140,51,0.22)",
};

/** Diwali Edition — Deep purple and gold. */
export const diwaliTheme: ThemeTokens = {
  background: "#120024",
  surface: "#1E003D",
  surfaceElevated: "#2A0054",
  card: "#35006B",
  glass: "rgba(255,215,0,0.1)",
  primary: "#FFD700",
  primaryGlow: "rgba(255,215,0,0.4)",
  secondary: "#FF4500",
  accent: "#FF00FF",
  warning: "#FFA500",
  error: "#FF3333",
  success: "#CCFF00",
  textPrimary: "#FFF8DC",
  textSecondary: "#B19CD9",
  border: "rgba(255,215,0,0.2)",
  cardGlow: "rgba(255,215,0,0.25)",
};

/** Holi Edition — Vibrant and multi-colored. */
export const holiTheme: ThemeTokens = {
  background: "#001219",
  surface: "#00232E",
  surfaceElevated: "#003444",
  card: "#00455A",
  glass: "rgba(233,196,106,0.15)",
  primary: "#E76F51",
  primaryGlow: "rgba(231,111,81,0.4)",
  secondary: "#2A9D8F",
  accent: "#E9C46A",
  warning: "#F4A261",
  error: "#E63946",
  success: "#2A9D8F",
  textPrimary: "#F1FAEE",
  textSecondary: "#A8DADC",
  border: "rgba(233,196,106,0.2)",
  cardGlow: "rgba(231,111,81,0.3)",
};

export const radius = { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 };

export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

export const typography: Record<string, TextStyle> = {
  display: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 36 },
  h1: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 24 },
  h2: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 20 },
  body: { fontFamily: "Inter_400Regular", fontSize: 15 },
  bodyMedium: { fontFamily: "Inter_500Medium", fontSize: 15 },
  caption: { fontFamily: "Inter_400Regular", fontSize: 12 },
  amount: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 22 },
};

export const shadows = {
  cardGlow: {
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
};

/** Preset accents — primary + glow for useTheme merge. Saffron first (default for India). */
export const accentPalette = [
  { key: "saffron" as const, primary: "#FF6B00", glow: "rgba(255,107,0,0.3)", light: "#FF8C33" },
  { key: "violet" as const, primary: "#6C63FF", glow: "rgba(108,99,255,0.3)", light: "#8B84FF" },
  { key: "mint" as const, primary: "#00D4AA", glow: "rgba(0,212,170,0.3)", light: "#33DDBB" },
  { key: "pink" as const, primary: "#FF6B9D", glow: "rgba(255,107,157,0.3)", light: "#FF8FB5" },
  { key: "amber" as const, primary: "#FFB347", glow: "rgba(255,179,71,0.3)", light: "#FFC570" },
  { key: "green" as const, primary: "#4CAF82", glow: "rgba(76,175,130,0.3)", light: "#6DC49A" },
  { key: "blue" as const, primary: "#4FC3F7", glow: "rgba(79,195,247,0.3)", light: "#72CEFF" },
];

export type AccentPaletteKey = (typeof accentPalette)[number]["key"];

/** Named accent presets (alias for profile / theme). */
export const accentColors = Object.fromEntries(
  accentPalette.map((a) => [a.key, { primary: a.primary, glow: a.glow, light: a.light }]),
) as Record<AccentPaletteKey, { primary: string; glow: string; light: string }>;

export type AccentColorKey = AccentPaletteKey;

export const ACCENT_OPTIONS = accentPalette.map((a) => a.primary);

export const fontScales = {
  small: { body: 13, caption: 11, heading: 18, display: 28 },
  medium: { body: 15, caption: 12, heading: 20, display: 32 },
  large: { body: 17, caption: 14, heading: 24, display: 38 },
} as const;

export type FontScalePreset = keyof typeof fontScales;
