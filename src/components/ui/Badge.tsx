import { Text, View } from "react-native";
import { radius } from "@/constants/theme";

export function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        borderRadius: radius.full,
        backgroundColor: "#FF6B9D",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 10, fontFamily: "Inter_500Medium" }}>
        {count > 9 ? "9+" : count}
      </Text>
    </View>
  );
}
