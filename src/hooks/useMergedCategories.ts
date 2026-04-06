import { useMemo } from "react";
import type { CategoryDef } from "@/constants/categories";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { useCategoryStore } from "@/store/useCategoryStore";

/** DB categories overlaid on defaults, sorted by name. */
export function useMergedCategories(): CategoryDef[] {
  const rows = useCategoryStore((s) => s.categories);
  return useMemo(() => {
    const map = new Map<string, CategoryDef>();
    for (const c of DEFAULT_CATEGORIES) map.set(c.id, c);
    for (const r of rows) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        icon: r.icon,
        color: r.color,
        type: r.type as CategoryDef["type"],
      });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);
}
