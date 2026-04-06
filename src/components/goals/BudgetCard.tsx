import { useCallback, useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import type { BudgetRow } from "@/db/queries/budgets";

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcD(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const ARC_START = -210;
const ARC_END = 30;

function fillColor(pct: number): string {
  if (pct < 0.6) return "#4CAF82";
  if (pct <= 0.85) return "#FFB347";
  return "#FF5C5C";
}

export function BudgetCard({
  budget,
  spent,
  categoryName,
  categoryIcon,
  categoryColor,
  currency,
  onEdit,
  onDelete,
}: {
  budget: BudgetRow;
  spent: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  currency: CurrencyCode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const { light } = useHaptics();
  const limit = budget.monthlyLimit;
  const pctUsed = limit > 0 ? spent / limit : 0;
  const displayPct = limit > 0 ? Math.min(999, Math.round(pctUsed * 100)) : 0;
  const over = limit > 0 && spent > limit;
  const strokeColor = fillColor(Math.min(1, pctUsed));

  const w = 200;
  const h = 140;
  const cx = w / 2;
  const cy = h - 4;
  const R = 60;
  const [fillPath, setFillPath] = useState(() => arcD(cx, cy, R, ARC_START, ARC_START));

  const progress = useSharedValue(0);
  const updatePath = useCallback(
    (endAngle: number) => {
      setFillPath(arcD(cx, cy, R, ARC_START, endAngle));
    },
    [cx, cy, R],
  );

  useEffect(() => {
    const t = limit > 0 ? Math.min(1, spent / limit) : 0;
    progress.value = 0;
    progress.value = withTiming(t, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [spent, limit, progress]);

  useAnimatedReaction(
    () => progress.value,
    (v) => {
      const span = ARC_END - ARC_START;
      runOnJS(updatePath)(ARC_START + span * v);
    },
    [updatePath],
  );

  const y = Math.floor(budget.month / 100);
  const m = budget.month % 100;
  const monthEnd = new Date(y, m, 0, 23, 59, 59, 999).getTime();
  const daysLeft = Math.max(0, Math.ceil((monthEnd - Date.now()) / (24 * 60 * 60 * 1000)));
  const monthLabel = format(new Date(y, m - 1, 1), "MMMM");

  const statusText =
    over || pctUsed > 1 ? "Over budget!" : pctUsed >= 0.85 ? "Approaching limit" : "On track";

  const openMenu = useCallback(() => {
    light();
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Edit", "Delete"],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (i) => {
          if (i === 1) onEdit();
          if (i === 2) onDelete();
        },
      );
      return;
    }
    Alert.alert("Budget", undefined, [
      { text: "Edit", onPress: onEdit },
      { text: "Delete", style: "destructive", onPress: onDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [light, onEdit, onDelete]);

  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderLeftWidth: over ? 4 : 1,
        borderLeftColor: over ? "#FF5C5C" : colors.border,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: categoryColor + "33",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name={categoryIcon as never} size={20} color={categoryColor} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            color: colors.textPrimary,
            fontFamily: "SpaceGrotesk_600SemiBold",
            fontSize: 16,
            flex: 1,
            marginLeft: 10,
          }}
        >
          {categoryName}
        </Text>
        <Pressable onPress={openMenu} hitSlop={10} accessibilityLabel="Budget menu">
          <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={{ alignItems: "center" }}>
        <Svg width={w} height={h}>
          <Path d={arcD(cx, cy, R, ARC_START, ARC_END)} stroke={colors.border} strokeWidth={10} fill="none" strokeLinecap="round" />
          <Path d={fillPath} stroke={strokeColor} strokeWidth={10} fill="none" strokeLinecap="round" opacity={pctUsed > 1 ? 0.85 : 1} />
        </Svg>
        <View style={{ position: "absolute", top: 48, alignItems: "center" }}>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 26 }}>{displayPct}%</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
          </Text>
        </View>
      </View>

      <Text
        style={{
          textAlign: "center",
          marginTop: 4,
          fontFamily: "Inter_500Medium",
          fontSize: 14,
          color: over || pctUsed > 1 ? "#FF5C5C" : pctUsed >= 0.85 ? "#FFB347" : "#4CAF82",
        }}
      >
        {statusText}
      </Text>

      <View style={{ alignSelf: "center", marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceElevated }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left in {monthLabel}
        </Text>
      </View>
    </View>
  );
}
