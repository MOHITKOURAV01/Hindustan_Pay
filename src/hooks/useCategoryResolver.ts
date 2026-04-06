import { useMemo } from "react";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { useCategoryStore } from "@/store/useCategoryStore";

export type ResolvedCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  isCustom?: boolean;
};

/** Resolve category by id: DB rows win; fall back to bundled defaults. */
export function useCategoryResolver(): (id: string | null | undefined) => ResolvedCategory | undefined {
  const rows = useCategoryStore((s) => s.categories);
  return useMemo(() => {
    const map = new Map<string, ResolvedCategory>();
    for (const c of DEFAULT_CATEGORIES) {
      map.set(c.id, { ...c, isCustom: false });
    }
    for (const r of rows) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        icon: r.icon,
        color: r.color,
        type: r.type as ResolvedCategory["type"],
        isCustom: r.isCustom,
      });
    }
    return (id: string | null | undefined) => (id ? map.get(id) : undefined);
  }, [rows]);
}
