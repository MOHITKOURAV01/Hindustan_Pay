import { create } from "zustand";
import { addDays } from "date-fns";
import type { EMI } from "@/types/emi";
import { deleteEMI, getAllEMIs, insertEMI, updateEMI } from "@/db/queries/emis";
import { insertTransaction } from "@/db/queries/transactions";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useInsightStore } from "@/store/useInsightStore";
import { scheduleEMIReminder } from "@/utils/notifications";

type EMIState = {
  emis: EMI[];
  isLoading: boolean;
  loadEMIs: () => Promise<void>;
  addEMI: (emi: Omit<EMI, "id" | "createdAt">) => Promise<void>;
  updateEMI: (id: string, updates: Partial<EMI>) => Promise<void>;
  deleteEMI: (id: string) => Promise<void>;
  markEMIPaid: (emiId: string) => Promise<void>;
};

export const useEMIStore = create<EMIState>((set, get) => ({
  emis: [],
  isLoading: true,
  loadEMIs: async () => {
    set({ isLoading: true });
    const rows = await getAllEMIs();
    set({ emis: rows, isLoading: false });
  },
  addEMI: async (row) => {
    const id = await insertEMI({
      ...row,
      isActive: 1,
    });
    await get().loadEMIs();
    const created = get().emis.find((e) => e.id === id);
    if (created) await scheduleEMIReminder(created);
  },
  updateEMI: async (id, updates) => {
    await updateEMI(id, updates);
    await get().loadEMIs();
    const updated = get().emis.find((e) => e.id === id);
    if (updated) await scheduleEMIReminder(updated);
  },
  deleteEMI: async (id) => {
    await deleteEMI(id);
    await get().loadEMIs();
  },
  markEMIPaid: async (emiId) => {
    const e = get().emis.find((x) => x.id === emiId);
    if (!e) return;
    const now = Date.now();

    insertTransaction({
      id: `${emiId}_${now}`,
      amount: e.emiAmount,
      type: "expense",
      categoryId: "cat_emi",
      paymentMode: "net_banking",
      title: `${e.name} EMI`,
      notes: null,
      date: now,
      currency: "INR",
      isDeleted: false,
      isStarred: false,
      isArchived: false,
      isRecurring: false,
      recurrenceRule: null,
      recurrenceEndDate: null,
      parentTransactionId: null,
    });

    const remaining = Math.max(0, (e.remainingMonths ?? 0) - 1);
    const nextDue = addDays(e.nextDueDate, 30).getTime();
    await updateEMI(emiId, {
      remainingMonths: remaining,
      nextDueDate: nextDue,
      isActive: remaining <= 0 ? 0 : 1,
    });

    useTransactionStore.getState().loadTransactions();
    await useInsightStore.getState().calculateInsights();
    await get().loadEMIs();

    const updated = get().emis.find((x) => x.id === emiId);
    if (updated) await scheduleEMIReminder(updated);
  },
}));

