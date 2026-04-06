/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        surface: "#12121A",
        surfaceElevated: "#1A1A27",
        card: "#1E1E2E",
        primary: "#6C63FF",
        secondary: "#00D4AA",
        accent: "#FF6B9D",
        warning: "#FFB347",
        error: "#FF5C5C",
        success: "#4CAF82",
        textPrimary: "#F0F0FF",
        textSecondary: "#8888AA",
      },
      fontFamily: {
        display: ["SpaceGrotesk_700Bold"],
        heading: ["SpaceGrotesk_600SemiBold"],
        body: ["Inter_400Regular"],
        bodyMedium: ["Inter_500Medium"],
      },
    },
  },
  plugins: [],
};
