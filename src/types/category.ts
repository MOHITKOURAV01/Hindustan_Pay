/** Category row shape (SQLite / Drizzle). */
export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  /** 1 = user-created, 0 = seeded default */
  isCustom: boolean;
};
