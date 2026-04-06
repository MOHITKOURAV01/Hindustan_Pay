import { Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import type { FilterState } from "@/types/transaction";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { useTheme } from "@/hooks/useTheme";

export function TransactionFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
}) {
  const { colors } = useTheme();
  const merged = useMergedCategories();
  const presets: { key: FilterState["datePreset"]; label: string }[] = [
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
    { key: "lastMonth", label: "Last month" },
    { key: "all", label: "All time" },
  ];
  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Date range</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {presets.map((p) => (
            <Chip
              key={p.key}
              label={p.label}
              selected={filters.datePreset === p.key}
              onPress={() => onChange({ datePreset: p.key })}
            />
          ))}
        </View>
      </View>
      <View>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Type</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["all", "income", "expense"] as const).map((p) => (
            <Chip key={p} label={p} selected={filters.type === p} onPress={() => onChange({ type: p })} />
          ))}
        </View>
      </View>
      <View>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Sort</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(
            [
              ["newest", "Newest"],
              ["oldest", "Oldest"],
              ["amountHigh", "Amount ↓"],
              ["amountLow", "Amount ↑"],
            ] as const
          ).map(([k, label]) => (
            <Chip key={k} label={label} selected={filters.sort === k} onPress={() => onChange({ sort: k })} />
          ))}
        </View>
      </View>
      <View>
        <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Categories</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {merged.slice(0, 24).map((c) => {
            const selected = filters.categoryIds.includes(c.id);
            return (
              <Chip
                key={c.id}
                label={c.name}
                selected={selected}
                onPress={() => {
                  const next = selected
                    ? filters.categoryIds.filter((id) => id !== c.id)
                    : [...filters.categoryIds, c.id];
                  onChange({ categoryIds: next });
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}
