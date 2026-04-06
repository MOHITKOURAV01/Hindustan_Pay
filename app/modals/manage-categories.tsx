import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { nanoid } from "nanoid/non-secure";
import {
  countTransactionsUsingCategory,
  deleteCategoryRow,
  insertCategory,
  reassignTransactionsCategory,
  updateCategoryRow,
  type CategoryRow,
} from "@/db/queries/categories";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";

const OTHER_ID = "cat_other";

const ICON_GRID: (keyof typeof MaterialCommunityIcons.glyphMap)[] = [
  "wallet",
  "food",
  "car",
  "home",
  "heart",
  "shopping-outline",
  "airplane",
  "book-open",
  "gamepad",
  "coffee",
  "dumbbell",
  "gift",
  "music-note",
  "school",
  "briefcase",
  "chart-line",
  "camera",
  "dog",
  "tree",
  "phone-plus",
  "bank",
  "cash",
  "cart",
  "cellphone",
  "hospital-box",
  "movie",
  "palette",
  "run",
  "silverware-fork-knife",
  "sofa",
  "train",
  "umbrella",
  "video",
  "wifi",
  "wrench",
  "beach",
  "bike",
  "flower",
  "laptop",
];

const SWATCHES = [
  "#6C63FF",
  "#00D4AA",
  "#FF6B9D",
  "#FFB347",
  "#4CAF82",
  "#4FC3F7",
  "#FF5C5C",
  "#AB47BC",
  "#26A69A",
  "#FFCA28",
  "#78909C",
  "#8D6E63",
];

type SheetMode = null | { kind: "add" } | { kind: "edit"; row: CategoryRow };

function CategoryEditorSheet({
  visible,
  mode,
  onClose,
  onSaved,
}: {
  visible: boolean;
  mode: SheetMode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<keyof typeof MaterialCommunityIcons.glyphMap>("wallet");
  const [color, setColor] = useState(SWATCHES[0]);
  const [type, setType] = useState<"income" | "expense" | "both">("expense");

  useEffect(() => {
    if (!visible || !mode) return;
    if (mode.kind === "add") {
      setName("");
      setIcon("wallet");
      setColor(SWATCHES[0]);
      setType("expense");
    } else {
      setName(mode.row.name);
      setIcon((mode.row.icon as keyof typeof MaterialCommunityIcons.glyphMap) ?? "wallet");
      setColor(mode.row.color);
      setType(mode.row.type as typeof type);
    }
  }, [visible, mode]);

  const save = () => {
    const n = name.trim();
    if (!n) {
      Alert.alert("Name required", "Please enter a category name.");
      return;
    }
    if (mode?.kind === "add") {
      insertCategory({
        id: `cat_${nanoid(10)}`,
        name: n,
        icon: icon as string,
        color,
        type,
        isCustom: true,
      });
    } else if (mode?.kind === "edit" && mode.row.isCustom) {
      updateCategoryRow(mode.row.id, { name: n, icon: icon as string, color, type });
    }
    onSaved();
    onClose();
  };

  if (!mode) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose} />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "50%",
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 24,
        }}
      >
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18 }}>
            {mode.kind === "add" ? "New category" : "Edit category"}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Category name"
            placeholderTextColor={colors.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 12,
              color: colors.textPrimary,
              marginBottom: 16,
            }}
          />
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Icon</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {ICON_GRID.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: icon === ic ? colors.primary + "33" : colors.surface,
                  borderWidth: 1,
                  borderColor: icon === ic ? colors.primary : colors.border,
                }}
              >
                <MaterialCommunityIcons name={ic} size={22} color={color} />
              </Pressable>
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Color</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            {SWATCHES.map((sw) => (
              <Pressable
                key={sw}
                onPress={() => setColor(sw)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: sw,
                  borderWidth: color === sw ? 3 : 0,
                  borderColor: "#fff",
                }}
              />
            ))}
          </View>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Type</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {(["income", "expense", "both"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: type === t ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: type === t ? "#fff" : colors.textPrimary, textTransform: "capitalize" }}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Save" onPress={save} />
          <Pressable onPress={onClose} style={{ marginTop: 12, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ManageCategoriesModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const [sheet, setSheet] = useState<SheetMode>(null);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const income = useMemo(
    () => categories.filter((c) => c.type === "income" || c.type === "both"),
    [categories],
  );
  const expense = useMemo(
    () => categories.filter((c) => c.type === "expense" || c.type === "both"),
    [categories],
  );

  const refresh = useCallback(() => {
    loadCategories();
    loadTransactions();
  }, [loadCategories, loadTransactions]);

  const confirmDelete = (row: CategoryRow) => {
    if (!row.isCustom) return;
    const n = countTransactionsUsingCategory(row.id);
    const proceed = () => {
      if (n > 0) {
        reassignTransactionsCategory(row.id, OTHER_ID);
      }
      deleteCategoryRow(row.id);
      refresh();
    };
    if (n > 0) {
      Alert.alert(
        "Delete category",
        `${n} transaction${n === 1 ? "" : "s"} use this category. They will be moved to "Other". Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", style: "destructive", onPress: proceed },
        ],
      );
    } else {
      Alert.alert("Delete category", `Remove "${row.name}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: proceed },
      ]);
    }
  };

  const sections = useMemo(
    () => [
      { title: "Income categories", data: income },
      { title: "Expense categories", data: expense },
    ],
    [income, expense],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Back</Text>
        </Pressable>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18 }}>Categories</Text>
        <Pressable onPress={() => setSheet({ kind: "add" })} hitSlop={12}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Add</Text>
        </Pressable>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderSectionHeader={({ section: { title } }) => (
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: "Inter_500Medium",
              textTransform: "uppercase",
              fontSize: 12,
              marginTop: 16,
              marginBottom: 8,
              marginHorizontal: 16,
            }}
          >
            {title}
          </Text>
        )}
        renderItem={({ item: row }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 16,
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: colors.surface,
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => {
                if (row.isCustom) setSheet({ kind: "edit", row });
              }}
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: row.color + "44",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name={row.icon as never} size={22} color={row.color} />
              </View>
              <Text style={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", marginLeft: 12, flex: 1 }}>{row.name}</Text>
              {!row.isCustom ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceElevated }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Default</Text>
                </View>
              ) : null}
            </Pressable>
            {row.isCustom ? (
              <View style={{ flexDirection: "row", gap: 4 }}>
                <Pressable onPress={() => setSheet({ kind: "edit", row })} hitSlop={8} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => confirmDelete(row)} hitSlop={8} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      <CategoryEditorSheet
        visible={sheet != null}
        mode={sheet}
        onClose={() => setSheet(null)}
        onSaved={refresh}
      />
    </SafeAreaView>
  );
}
