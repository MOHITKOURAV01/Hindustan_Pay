import { memo, useCallback } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
  type TextStyle,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import type { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks/useHaptics";
import { useCategoryResolver } from "@/hooks/useCategoryResolver";
import type { PaymentMode } from "@/types/transaction";

function paymentModeMeta(mode: PaymentMode | null | undefined): { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; color?: string } | null {
  if (!mode) return null;
  if (mode.startsWith("upi_")) {
    const id = mode.slice(4);
    if (id === "gpay") return { icon: "google-play", label: "UPI", color: "#4285F4" };
    if (id === "phonepe") return { icon: "phone", label: "UPI", color: "#5F259F" };
    if (id === "paytm") return { icon: "wallet", label: "UPI", color: "#002970" };
    if (id === "bhim") return { icon: "bank", label: "UPI", color: "#00838F" };
    if (id === "amazonpay") return { icon: "cart", label: "UPI", color: "#FF9900" };
    if (id === "cred") return { icon: "credit-card", label: "UPI", color: "#1C1C1C" };
    return { icon: "bank", label: "UPI" };
  }
  if (mode === "cash") return { icon: "cash", label: "Cash", color: "#4CAF82" };
  if (mode === "card_credit") return { icon: "credit-card-outline", label: "Card", color: "#4FC3F7" };
  if (mode === "card_debit") return { icon: "credit-card", label: "Card", color: "#4FC3F7" };
  if (mode === "net_banking") return { icon: "bank-transfer", label: "Net", color: "#FFB347" };
  if (mode === "wallet") return { icon: "wallet-outline", label: "Wallet", color: "#FF6B9D" };
  if (mode === "cheque") return { icon: "checkbook", label: "Cheque", color: "#8888AA" };
  if (mode === "emi") return { icon: "calendar-month", label: "EMI", color: "#E53935" };
  return { icon: "circle", label: "Mode" };
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightChunk({
  text,
  query,
  baseStyle,
  hlColor,
}: {
  text: string;
  query: string;
  baseStyle: TextStyle;
  hlColor: string;
}) {
  const q = query.trim();
  if (!q) return <Text style={baseStyle}>{text}</Text>;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
    const parts = text.split(re);
    if (parts.length <= 1) {
      const lower = text.toLowerCase();
      const idx = lower.indexOf(q.toLowerCase());
      if (idx < 0) return <Text style={baseStyle}>{text}</Text>;
      return (
        <Text style={baseStyle}>
          {text.slice(0, idx)}
          <Text style={[baseStyle, { backgroundColor: hlColor }]}>{text.slice(idx, idx + q.length)}</Text>
          {text.slice(idx + q.length)}
        </Text>
      );
    }
    return (
      <Text style={baseStyle}>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <Text key={`h-${i}-${part.slice(0, 8)}`} style={[baseStyle, { backgroundColor: hlColor }]}>
              {part}
            </Text>
          ) : (
            <Text key={`t-${i}`}>{part}</Text>
          ),
        )}
      </Text>
    );
  } catch {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx < 0) return <Text style={baseStyle}>{text}</Text>;
    return (
      <Text style={baseStyle}>
        {text.slice(0, idx)}
        <Text style={[baseStyle, { backgroundColor: hlColor }]}>{text.slice(idx, idx + q.length)}</Text>
        {text.slice(idx + q.length)}
      </Text>
    );
  }
}

export const TransactionCard = memo(function TransactionCard({
  t,
  currency,
  onPress,
  onDelete,
  onEdit,
  onStar,
  onDuplicate,
  searchQuery = "",
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onEnterSelection,
}: {
  t: Transaction;
  currency: CurrencyCode;
  onPress: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onStar: () => void;
  onDuplicate?: () => void;
  searchQuery?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Long-press enters bulk selection (when provided). */
  onEnterSelection?: () => void;
}) {
  const { colors } = useTheme();
  const { light, heavy } = useHaptics();
  const resolveCat = useCategoryResolver();
  const cat = resolveCat(t.categoryId);
  const hl = `${colors.primary}59`;

  const confirmDelete = useCallback(() => {
    heavy();
    Alert.alert("Delete transaction", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  }, [heavy, onDelete]);

  const showContextMenu = useCallback(() => {
    light();
    const dup = onDuplicate;
    if (Platform.OS === "ios") {
      const opts = dup ? (["Cancel", "Edit", "Duplicate", "Delete"] as const) : (["Cancel", "Edit", "Delete"] as const);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...opts],
          cancelButtonIndex: 0,
          destructiveButtonIndex: dup ? 3 : 2,
        },
        (i) => {
          if (i === 1) onEdit();
          if (dup && i === 2) dup();
          if (dup && i === 3) confirmDelete();
          if (!dup && i === 2) confirmDelete();
        },
      );
      return;
    }
    Alert.alert("Transaction", undefined, [
      { text: "Edit", onPress: onEdit },
      ...(dup ? [{ text: "Duplicate", onPress: dup }] : []),
      { text: "Delete", style: "destructive", onPress: confirmDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [light, onEdit, onDuplicate, confirmDelete]);

  const renderRight = useCallback(
    () => (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => {
            light();
            onEdit();
          }}
          style={{ backgroundColor: "#3D5AFE", justifyContent: "center", width: 64, height: "100%" }}
          accessibilityLabel="Edit"
        >
          <MaterialCommunityIcons name="pencil" size={22} color="#fff" style={{ alignSelf: "center" }} />
        </Pressable>
        {onDuplicate ? (
          <Pressable
            onPress={() => {
              light();
              onDuplicate();
            }}
            style={{ backgroundColor: "#5C6BC0", justifyContent: "center", width: 64, height: "100%" }}
            accessibilityLabel="Duplicate"
          >
            <MaterialCommunityIcons name="content-copy" size={22} color="#fff" style={{ alignSelf: "center" }} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={confirmDelete}
          style={{ backgroundColor: "#FF5C5C", justifyContent: "center", width: 64, height: "100%" }}
          accessibilityLabel="Delete"
        >
          <MaterialCommunityIcons name="trash-can" size={22} color="#fff" style={{ alignSelf: "center" }} />
        </Pressable>
      </View>
    ),
    [light, onEdit, onDuplicate, confirmDelete],
  );

  const renderLeft = useCallback(
    () => (
      <Pressable
        onPress={() => {
          light();
          onStar();
        }}
        style={{ backgroundColor: "#00D4AA", justifyContent: "center", width: 72, height: "100%" }}
        accessibilityLabel="Star"
      >
        <MaterialCommunityIcons name={t.isStarred ? "star" : "star-outline"} size={22} color="#0A0A0F" style={{ alignSelf: "center" }} />
      </Pressable>
    ),
    [light, onStar, t.isStarred],
  );

  const titleStr = t.title ?? "";
  const notesStr = t.notes ?? "";
  const catName = cat?.name ?? "—";
  const amtStr = formatCurrency(t.amount, currency);
  const pm = paymentModeMeta(t.paymentMode ?? null);
  const q = searchQuery.trim();
  let amountMatches = false;
  try {
    amountMatches =
      q.length > 0 && (String(t.amount).includes(q) || amtStr.toLowerCase().includes(q.toLowerCase()));
  } catch {
    amountMatches = q.length > 0 && String(t.amount).includes(q);
  }

  const inner = (
    <Pressable
      onPress={() => {
        if (selectionMode) {
          onToggleSelect?.();
          return;
        }
        onPress();
      }}
      onLongPress={() => {
        if (selectionMode) return;
        if (onEnterSelection) {
          onEnterSelection();
          return;
        }
        showContextMenu();
      }}
      delayLongPress={380}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
        backgroundColor: colors.surface,
        borderWidth: selectionMode ? 2 : 0,
        borderColor: selected ? colors.primary : "transparent",
        borderRadius: selectionMode ? 12 : 0,
      }}
      accessibilityRole="button"
    >
      {selectionMode ? (
        <View style={{ width: 28, alignItems: "center", marginRight: 4 }}>
          <MaterialCommunityIcons name={selected ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={selected ? colors.primary : colors.textSecondary} />
        </View>
      ) : null}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: (cat?.color ?? colors.primary) + "33",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name={(cat?.icon ?? "circle") as keyof typeof MaterialCommunityIcons.glyphMap}
          size={24}
          color={cat?.color ?? colors.primary}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <HighlightChunk
          text={titleStr || "—"}
          query={q}
          baseStyle={{ color: colors.textPrimary, fontFamily: "Inter_500Medium", fontSize: 16 }}
          hlColor={hl}
        />
        <HighlightChunk
          text={notesStr ? `${catName} · ${notesStr}` : catName}
          query={q}
          baseStyle={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}
          hlColor={hl}
        />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        {!selectionMode ? (
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              showContextMenu();
            }}
            hitSlop={10}
            style={{ padding: 4, marginBottom: 2 }}
            accessibilityLabel="More actions"
          >
            <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
        <Text
          style={{
            color: amountMatches ? colors.primary : t.type === "income" ? colors.success : colors.error,
            fontFamily: "SpaceGrotesk_600SemiBold",
            fontSize: 16,
            backgroundColor: amountMatches ? hl : "transparent",
          }}
        >
          {t.type === "expense" ? "-" : "+"}
          {amtStr}
        </Text>
        {pm ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <MaterialCommunityIcons name={pm.icon} size={14} color={pm.color ?? colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{pm.label}</Text>
          </View>
        ) : null}
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
          {formatDistanceToNow(t.date, { addSuffix: true })}
        </Text>
      </View>
    </Pressable>
  );

  if (selectionMode) {
    return inner;
  }

  return (
    <Swipeable
      renderRightActions={renderRight}
      renderLeftActions={renderLeft}
      overshootRight={false}
      overshootLeft={false}
      activeOffsetX={[-20, 20]}
      failOffsetY={[-80, 80]}
    >
      {inner}
    </Swipeable>
  );
});
