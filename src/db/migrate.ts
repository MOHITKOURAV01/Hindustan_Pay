/**
 * Drizzle migrator hook. Replace `drizzle/migrations.ts` with output from `npm run db:generate`.
 */
export async function runMigrations(): Promise<void> {
  try {
    const { migrate } = await import("drizzle-orm/expo-sqlite/migrator");
    const { db } = await import("./client");
    const mod = await import("../../drizzle/migrations");
    await migrate(db, mod.default);
  } catch {
    /* Optional until generated migrations exist; init.ts applies legacy patches. */
  }
}
