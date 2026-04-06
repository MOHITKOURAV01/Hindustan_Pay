import { create } from "zustand";
import { fetchAllCategories, type CategoryRow } from "@/db/queries/categories";

type CategoryStore = {
  categories: CategoryRow[];
  loadCategories: () => void;
};

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loadCategories: () => set({ categories: fetchAllCategories() }),
}));
