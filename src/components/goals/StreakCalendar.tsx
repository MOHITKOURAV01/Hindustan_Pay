import { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { subDays } from "date-fns";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";

type Cell = { key: string; intensity: number; label: string };

export function StreakCalendar({ scores }: { scores: Record<string, number> }) {
  const { colors } = useTheme();
  const [tip, setTip] = useState<{ label: string; score: number } | null>(null);
  const cells: Cell[] = useMemo(() => {
    const out: Cell[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = subDays(Date.now(), i);
      const key = d.toISOString().slice(0, 10);
      const v = scores[key] ?? 0;
      out.push({ key, intensity: v, label: key });
    }
    return out;
  }, [scores]);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {cells.map((c) => {
        const bg =
          c.intensity > 0.66 ? "rgba(76,175,130,0.85)" : c.intensity > 0.33 ? "rgba(255,179,71,0.7)" : "rgba(255,92,92,0.35)";
        return (
          <Pressable
            key={c.key}
            accessibilityLabel={`Day ${c.label}`}
            onPress={() => setTip({ label: c.label, score: c.intensity })}
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: bg }}
          />
        );
      })}
      <Modal visible={tip != null} transparent animationType="fade" onRequestClose={() => setTip(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }} onPress={() => setTip(null)}>
          <Pressable
            onPress={() => setTip(null)}
            style={{
              alignSelf: "center",
              backgroundColor: colors.card,
              padding: 20,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              maxWidth: 320,
            }}
          >
            {tip ? (
              <>
                <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 17 }}>
                  {format(new Date(tip.label + "T12:00:00"), "EEEE, MMM d, yyyy")}
                </Text>
                <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 14 }}>
                  Discipline score: {Math.round(tip.score * 100)}%
                </Text>
                <Text style={{ color: colors.primary, marginTop: 14, fontFamily: "Inter_500Medium" }}>Tap to close</Text>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
