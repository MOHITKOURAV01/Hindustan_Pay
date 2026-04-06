import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { useTheme } from "@/hooks/useTheme";

export function CategoryPicker({
  type,
  value,
  onChange,
}: {
  type: "income" | "expense";
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();
  const merged = useMergedCategories();
  const list = merged.filter((c) => c.type === type || c.type === "both");
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
      {list.map((c) => {
        const selected = value === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(c.id)}
            style={{
              width: 84,
              paddingVertical: 10,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? `${colors.primary}33` : colors.surfaceElevated,
              alignItems: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={c.name}
          >
            <MaterialCommunityIcons name={c.icon as never} size={24} color={c.color} />
            <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 11, marginTop: 6 }}>
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
