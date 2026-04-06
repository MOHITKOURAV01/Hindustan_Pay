import { forwardRef, useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { CategoryDef } from "@/constants/categories";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";

export type CategoryPickerSheetRef = BottomSheetModal;

export const CategoryPickerSheet = forwardRef<
  BottomSheetModal,
  {
    onSelect: (c: CategoryDef) => void;
  }
>(function CategoryPickerSheet({ onSelect }, ref) {
  const { colors } = useTheme();
  const { light } = useHaptics();
  const merged = useMergedCategories();
  const list = useMemo(() => merged.filter((c) => c.type === "expense" || c.type === "both"), [merged]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["55%"]}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
    >
      <BottomSheetView style={{ padding: 16, flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, marginBottom: 12 }}>
          Select category
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {list.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                light();
                onSelect(c);
              }}
              style={{
                width: "30%",
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons name={c.icon as never} size={26} color={c.color} />
              <Text numberOfLines={2} style={{ color: colors.textPrimary, fontSize: 11, marginTop: 6, textAlign: "center" }}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
