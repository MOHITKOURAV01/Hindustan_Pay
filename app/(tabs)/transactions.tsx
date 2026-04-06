import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, SectionList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTransactionStore } from "@/store/useTransactionStore";
import { applyFilters } from "@/db/queries/transactions";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionEmpty } from "@/components/transactions/TransactionEmpty";
import { Button } from "@/components/ui/Button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useToastStore } from "@/components/ui/Toast";
import type { Transaction } from "@/types/transaction";
import { VoiceInputSheet, type VoiceInputSheetRef } from "@/components/transactions/VoiceInputSheet";
import { useStrings } from "@/hooks/useStrings";
import { useHaptics } from "@/hooks/useHaptics";
import type { CategoryDef } from "@/constants/categories";
import { useMergedCategories } from "@/hooks/useMergedCategories";
import { formatCurrency } from "@/utils/formatCurrency";

const SEARCH_HISTORY_KEY = "hp_search_history";

function groupLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  if (format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "Today";
  if (format(d, "yyyy-MM-dd") === format(yday, "yyyy-MM-dd")) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

function categoryLabel(id: string | null, merged: CategoryDef[]): string {
  if (!id) return "";
  return merged.find((c) => c.id === id)?.name ?? "";
}

function transactionMatchesSearch(t: Transaction, qq: string, merged: CategoryDef[]): boolean {
  if (!qq.trim()) return true;
  const q = qq.toLowerCase().trim();
  if ((t.title ?? "").toLowerCase().includes(q)) return true;
  if ((t.notes ?? "").toLowerCase().includes(q)) return true;
  if (categoryLabel(t.categoryId, merged).toLowerCase().includes(q)) return true;
  if (String(t.amount).includes(q)) return true;
  const cur = formatCurrency(t.amount, "INR");
  if (cur.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))) return true;
  return false;
}

function TransactionsBody() {
  const router = useRouter();
  const { colors } = useTheme();
  const currency = useCurrency();
  const merged = useMergedCategories();
  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const setFilters = useTransactionStore((s) => s.setFilters);
  const resetFilters = useTransactionStore((s) => s.resetFilters);
  const filters = useTransactionStore((s) => s.filters);
  const deleteTx = useTransactionStore((s) => s.deleteTransaction);
  const bulkDeleteTx = useTransactionStore((s) => s.bulkDeleteTransactions);
  const starTx = useTransactionStore((s) => s.starTransaction);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const bulkConfirmRef = useRef<BottomSheetModal>(null);
  const voiceSheetRef = useRef<VoiceInputSheetRef>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedCategoryParam = useRef<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const sheetRef = useRef<BottomSheetModal>(null);
  const { light } = useHaptics();
  const showToast = useToastStore((s) => s.show);
  const { categoryId: routeCategoryId } = useLocalSearchParams<{ categoryId?: string }>();

  useEffect(() => {
    if (typeof routeCategoryId !== "string" || routeCategoryId.length === 0) return;
    if (appliedCategoryParam.current === routeCategoryId) return;
    appliedCategoryParam.current = routeCategoryId;
    setFilters({ categoryIds: [routeCategoryId] });
  }, [routeCategoryId, setFilters]);

  useEffect(() => {
    void AsyncStorage.getItem(SEARCH_HISTORY_KEY).then((raw) => {
      if (!raw) return;
      try {
        setHistory(JSON.parse(raw) as string[]);
      } catch {
        /* noop */
      }
    });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(q), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const persistHistory = useCallback(async (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...history.filter((x) => x !== t)].slice(0, 5);
    setHistory(next);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  }, [history]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  const activeFilterCount =
    (filters.datePreset !== "all" ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    filters.categoryIds.length;

  const filteredBase = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelected({});
  }, []);

  const data = useMemo(() => {
    let list = filteredBase.filter((t) => transactionMatchesSearch(t, debouncedQ, merged));
    const groups = new Map<string, Transaction[]>();
    for (const t of list) {
      const key = groupLabel(t.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [filteredBase, debouncedQ, merged]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionCard
        t={item}
        currency={currency}
        searchQuery={debouncedQ}
        selectionMode={selectionMode}
        selected={!!selected[item.id]}
        onToggleSelect={() =>
          setSelected((s) => ({
            ...s,
            [item.id]: !s[item.id],
          }))
        }
        onEnterSelection={() => {
          setSelectionMode(true);
          setSelected((s) => ({ ...s, [item.id]: true }));
        }}
        onPress={() => router.push(`/modals/transaction-detail?id=${item.id}` as never)}
        onDelete={() => deleteTx(item.id)}
        onEdit={() => router.push(`/modals/edit-transaction?id=${item.id}` as never)}
        onStar={() => starTx(item.id, !item.isStarred)}
        onDuplicate={() => router.push(`/modals/add-transaction?duplicateFrom=${item.id}` as never)}
      />
    ),
    [currency, router, deleteTx, starTx, debouncedQ, selectionMode, selected],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View style={{ backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 16 }}>
        <Text style={{ color: colors.textSecondary, fontFamily: "Inter_500Medium" }}>{title}</Text>
      </View>
    ),
    [colors.background, colors.textSecondary],
  );

  const listEmpty =
    !isLoading &&
    (data.length === 0 || data.every((s) => s.data.length === 0));

  if (!isLoading && transactions.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TransactionEmpty />
      </SafeAreaView>
    );
  }

  const selectAllVisible = useCallback(() => {
    const ids = filteredBase.filter((t) => transactionMatchesSearch(t, debouncedQ, merged)).map((t) => t.id);
    const next: Record<string, boolean> = {};
    for (const id of ids) next[id] = true;
    setSelected(next);
  }, [filteredBase, debouncedQ, merged]);

  const bulkExport = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const rows = transactions.filter((t) => selectedIds.includes(t.id));
    const header = "Date,Amount,Type,Title,Category";
    const body = rows
      .map((t) => {
        const cat = categoryLabel(t.categoryId, merged);
        return `${format(t.date, "yyyy-MM-dd")},${t.amount},${t.type},"${(t.title ?? "").replace(/"/g, '""')}",${cat}`;
      })
      .join("\n");
    const path = `${FileSystem.cacheDirectory}hindustan_selected.csv`;
    await FileSystem.writeAsStringAsync(path, `${header}\n${body}`, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: "Export selected" });
    showToast({ variant: "success", message: `Shared ${selectedIds.length} transactions` });
  }, [selectedIds, transactions, showToast, merged]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {selectionMode ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 8,
          }}
        >
          <Pressable onPress={exitSelection}>
            <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium" }}>Cancel</Text>
          </Pressable>
          <Text style={{ flex: 1, color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", textAlign: "center" }}>
            {selectedIds.length} selected
          </Text>
          <Pressable
            onPress={() => {
              light();
              const all = filteredBase.filter((t) => transactionMatchesSearch(t, debouncedQ, merged));
              const allOn = all.length > 0 && all.every((t) => selected[t.id]);
              if (allOn) setSelected({});
              else selectAllVisible();
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 13 }}>
              {filteredBase.filter((t) => transactionMatchesSearch(t, debouncedQ, merged)).every((t) => selected[t.id]) &&
              filteredBase.filter((t) => transactionMatchesSearch(t, debouncedQ, merged)).length > 0
                ? "Deselect all"
                : "Select all"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              light();
              void bulkExport();
            }}
            disabled={selectedIds.length === 0}
            style={{ opacity: selectedIds.length ? 1 : 0.35 }}
          >
            <MaterialCommunityIcons name="share-variant" size={24} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => {
              light();
              if (selectedIds.length === 0) return;
              bulkConfirmRef.current?.present();
            }}
            disabled={selectedIds.length === 0}
            style={{ opacity: selectedIds.length ? 1 : 0.35 }}
          >
            <MaterialCommunityIcons name="delete-outline" size={26} color={colors.error} />
          </Pressable>
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            backgroundColor: colors.surface,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={colors.textSecondary} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.textSecondary}
            value={q}
            onChangeText={setQ}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (q.trim()) void persistHistory(q);
            }}
            style={{ flex: 1, paddingVertical: 10, marginLeft: 8, color: colors.textPrimary, fontFamily: "Inter_400Regular" }}
          />
          <Pressable
            onPress={() => {
              light();
              voiceSheetRef.current?.present();
            }}
            accessibilityLabel="Voice search"
          >
            <MaterialCommunityIcons name="microphone-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => {
            if (selectionMode) return;
            light();
            sheetRef.current?.present();
          }}
          disabled={selectionMode}
          accessibilityLabel="Open filters"
          style={{ padding: 10, position: "relative", opacity: selectionMode ? 0.35 : 1 }}
        >
          <MaterialCommunityIcons name="filter-variant" size={26} color={colors.textPrimary} />
          {activeFilterCount > 0 ? (
            <View
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: "#FF6B9D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10 }}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      {focused && !q && history.length > 0 ? (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Recent</Text>
            <Pressable onPress={clearHistory}>
              <Text style={{ color: colors.primary, fontSize: 12 }}>Clear</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {history.map((h) => (
              <Pressable
                key={h}
                onPress={() => {
                  light();
                  setQ(h);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{h}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <Text style={{ color: colors.textSecondary, paddingHorizontal: 20, marginTop: 8 }}>
        {filteredBase.length} transactions
      </Text>
      {listEmpty ? (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, textAlign: "center" }}>
            No results
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 8 }}>
            Try adjusting search or filters.
          </Text>
          <View style={{ marginTop: 20 }}>
            <Button
              title="Clear filters"
              onPress={() => {
                light();
                resetFilters();
                setQ("");
              }}
            />
          </View>
        </View>
      ) : (
        <SectionList
          sections={data}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <VoiceInputSheet ref={voiceSheetRef} onResult={(text) => setQ(text)} />
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["60%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
      >
        <BottomSheetView style={{ padding: 20, flex: 1 }}>
          <TransactionFilters filters={filters} onChange={(p) => setFilters(p)} />
          <View style={{ marginTop: 16, gap: 10 }}>
            <Button title="Apply filters" onPress={() => sheetRef.current?.dismiss()} />
            <Button
              variant="ghost"
              title="Reset"
              onPress={() => {
                resetFilters();
                sheetRef.current?.dismiss();
              }}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
      <BottomSheetModal
        ref={bulkConfirmRef}
        snapPoints={["32%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surfaceElevated }}
      >
        <BottomSheetView style={{ padding: 20 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18 }}>
            Delete {selectedIds.length} transaction{selectedIds.length === 1 ? "" : "s"}?
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>This cannot be undone.</Text>
          <View style={{ marginTop: 20, gap: 10 }}>
            <Button
              variant="danger"
              title="Delete"
              onPress={() => {
                bulkDeleteTx(selectedIds);
                bulkConfirmRef.current?.dismiss();
                exitSelection();
                showToast({ variant: "success", message: `${selectedIds.length} transactions deleted` });
              }}
            />
            <Button variant="ghost" title="Cancel" onPress={() => bulkConfirmRef.current?.dismiss()} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

export default function TransactionsScreen() {
  return (
    <ErrorBoundary label="Transactions">
      <TransactionsBody />
    </ErrorBoundary>
  );
}
