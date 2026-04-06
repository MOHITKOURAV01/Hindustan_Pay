import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/utils/formatCurrency";
import type { SavingsSuggestion } from "@/utils/savingsSuggestions";
import { MotiView } from "moti";

type Props = {
  suggestions: SavingsSuggestion[];
  onAction: (id: string) => void;
};

export function SavingsSuggestions({ suggestions, onAction }: Props) {
  const { colors } = useTheme();
  const currency = useCurrency();

  if (suggestions.length === 0) return null;

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
      <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 16, marginBottom: 12 }}>
        Smart Suggestions
      </Text>
      <View style={{ gap: 12 }}>
        {suggestions.map((s, i) => (
          <MotiView
            key={s.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 100 }}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: s.priority === "high" ? `${colors.error}20` : `${colors.primary}20`,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <MaterialCommunityIcons
                name={s.icon as any}
                size={24}
                color={s.priority === "high" ? colors.error : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 15 }}>{s.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{s.description}</Text>
              {s.estimatedSaving > 0 && (
                <Text style={{ color: colors.success, fontSize: 12, marginTop: 4, fontFamily: "Inter_500Medium" }}>
                  Est. save: {formatCurrency(s.estimatedSaving, currency)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => onAction(s.id)}
              style={{
                backgroundColor: colors.surfaceElevated,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_500Medium" }}>View</Text>
            </Pressable>
          </MotiView>
        ))}
      </View>
    </View>
  );
}
