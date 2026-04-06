import { sqlite } from "./client";

const DDL = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL,
  is_custom INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category_id TEXT,
  payment_mode TEXT,
  title TEXT,
  notes TEXT,
  date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT,
  recurrence_end_date INTEGER,
  parent_transaction_id TEXT
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL DEFAULT 0,
  category_id TEXT,
  deadline INTEGER,
  emoji TEXT,
  color TEXT,
  streak_count INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  month INTEGER NOT NULL,
  alert_threshold_pct INTEGER NOT NULL DEFAULT 80
);

CREATE TABLE IF NOT EXISTS streak_entries (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  date INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emi (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  total_amount REAL NOT NULL,
  emi_amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  tenure_months INTEGER NOT NULL,
  start_date INTEGER NOT NULL,
  next_due_date INTEGER NOT NULL,
  remaining_months INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_streak_goal ON streak_entries(goal_id);
`;

const MIGRATION_ALTER = [
  `ALTER TABLE budgets ADD COLUMN alert_threshold_pct INTEGER NOT NULL DEFAULT 80`,
  `ALTER TABLE transactions ADD COLUMN recurrence_rule TEXT`,
  `ALTER TABLE transactions ADD COLUMN recurrence_end_date INTEGER`,
  `ALTER TABLE transactions ADD COLUMN parent_transaction_id TEXT`,
  `ALTER TABLE transactions ADD COLUMN payment_mode TEXT`,
];

const INDEX_MIGRATIONS = [
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_category_month ON budgets(category_id, month)`,
];

function applyLegacySqlPatches() {
  for (const sql of MIGRATION_ALTER) {
    try {
      sqlite.execSync(sql);
    } catch {
      /* column may already exist */
    }
  }
  for (const sql of INDEX_MIGRATIONS) {
    try {
      sqlite.execSync(sql);
    } catch {
      /* duplicate rows or index exists */
    }
  }
}

export function initDatabase() {
  sqlite.execSync(DDL);
  applyLegacySqlPatches();
  sqlite.execSync(
    `INSERT OR IGNORE INTO categories (id, name, icon, color, type, is_custom) VALUES ('cat_other', 'Other', 'help-circle-outline', '#8888AA', 'expense', 0);`,
  );
}

export function resetDatabase() {
  sqlite.execSync(`DROP TABLE IF EXISTS transactions;`);
  sqlite.execSync(`DROP TABLE IF EXISTS categories;`);
  sqlite.execSync(`DROP TABLE IF EXISTS goals;`);
  sqlite.execSync(`DROP TABLE IF EXISTS budgets;`);
  sqlite.execSync(`DROP TABLE IF EXISTS streak_entries;`);
  sqlite.execSync(`DROP TABLE IF EXISTS settings;`);
  sqlite.execSync(`DROP TABLE IF EXISTS emi;`);
  initDatabase();
}
