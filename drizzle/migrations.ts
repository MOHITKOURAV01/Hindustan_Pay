/** Placeholder bundle until `npm run db:generate` produces real migrations. */
export default {
  journal: {
    version: "7",
    dialect: "sqlite" as const,
    entries: [] as { idx: number; version: string; when: number; tag: string; breakpoints: boolean }[],
  },
  migrations: {} as Record<string, string>,
};
