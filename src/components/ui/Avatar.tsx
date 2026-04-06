import { Text, View } from "react-native";

export function Avatar({ name, hue }: { name: string; hue: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `hsl(${hue}, 70%, 45%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16 }}>{initials}</Text>
    </View>
  );
}
