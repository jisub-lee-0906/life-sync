import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);
export const userStatusEnum = pgEnum("user_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "INCOME",
  "EXPENSE",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("USER"),
  status: userStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => [
    primaryKey({
      columns: [table.provider, table.providerAccountId],
      name: "accounts_provider_provider_account_id_pk",
    }),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceTransactionId: uuid("source_transaction_id").references(
      (): AnyPgColumn => transactions.id,
      { onDelete: "cascade" },
    ),
    derivedYearMonth: varchar("derived_year_month", { length: 7 }),
    type: transactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    date: timestamp("date", { mode: "date", withTimezone: true }).notNull(),
    note: text("note"),
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurrenceDate: integer("recurrence_date"),
  },
  (table) => [
    check("transactions_amount_non_negative", sql`${table.amount} >= 0`),
    check(
      "transactions_recurrence_date_range",
      sql`${table.recurrenceDate} IS NULL OR (${table.recurrenceDate} >= 1 AND ${table.recurrenceDate} <= 31)`,
    ),
    unique("transactions_source_transaction_year_month_unique").on(
      table.sourceTransactionId,
      table.derivedYearMonth,
    ),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).notNull(),
    priority: varchar("priority", { length: 64 }).notNull(),
    progress: integer("progress").notNull().default(0),
    status: varchar("status", { length: 64 }).notNull(),
    date: date("date", { mode: "date" }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
  },
  (table) => [
    check(
      "tasks_progress_range",
      sql`${table.progress} >= 0 AND ${table.progress} <= 100`,
    ),
  ],
);

export const routines = pgTable("routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  monCheck: boolean("mon_check").notNull().default(false),
  tueCheck: boolean("tue_check").notNull().default(false),
  wedCheck: boolean("wed_check").notNull().default(false),
  thuCheck: boolean("thu_check").notNull().default(false),
  friCheck: boolean("fri_check").notNull().default(false),
  satCheck: boolean("sat_check").notNull().default(false),
  sunCheck: boolean("sun_check").notNull().default(false),
});

export const mandalarts = pgTable(
  "mandalarts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coreGoal: varchar("core_goal", { length: 255 }).notNull(),
  },
  (table) => [unique("mandalarts_user_id_unique").on(table.userId)],
);

export const mandalartCells = pgTable(
  "mandalart_cells",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mandalartId: uuid("mandalart_id")
      .notNull()
      .references(() => mandalarts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    goal: varchar("goal", { length: 255 }).notNull(),
    isCompleted: boolean("is_completed").notNull().default(false),
  },
  (table) => [
    unique("mandalart_cells_position_unique").on(
      table.mandalartId,
      table.position,
    ),
    check(
      "mandalart_cells_position_range",
      sql`${table.position} >= 1 AND ${table.position} <= 8`,
    ),
  ],
);

export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  scheduleIcon: varchar("schedule_icon", { length: 32 }).notNull().default("🗓️"),
  todoIcon: varchar("todo_icon", { length: 32 }).notNull().default("✅"),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  mandalarts: many(mandalarts),
  routines: many(routines),
  settings: one(settings, {
    fields: [users.id],
    references: [settings.userId],
  }),
  tasks: many(tasks),
  transactions: many(transactions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ many, one }) => ({
  derivedTransactions: many(transactions, {
    relationName: "transaction_source",
  }),
  sourceTransaction: one(transactions, {
    fields: [transactions.sourceTransactionId],
    references: [transactions.id],
    relationName: "transaction_source",
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const routinesRelations = relations(routines, ({ one }) => ({
  user: one(users, {
    fields: [routines.userId],
    references: [users.id],
  }),
}));

export const mandalartsRelations = relations(mandalarts, ({ many, one }) => ({
  cells: many(mandalartCells),
  user: one(users, {
    fields: [mandalarts.userId],
    references: [users.id],
  }),
}));

export const mandalartCellsRelations = relations(mandalartCells, ({ one }) => ({
  mandalart: one(mandalarts, {
    fields: [mandalartCells.mandalartId],
    references: [mandalarts.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email(),
});

export const selectAccountSchema = createSelectSchema(accounts);
export const insertAccountSchema = createInsertSchema(accounts);

export const selectTransactionSchema = createSelectSchema(transactions);
export const insertTransactionSchema = createInsertSchema(transactions);

export const selectTaskSchema = createSelectSchema(tasks);
export const insertTaskSchema = createInsertSchema(tasks);

export const selectRoutineSchema = createSelectSchema(routines);
export const insertRoutineSchema = createInsertSchema(routines);

export const selectMandalartSchema = createSelectSchema(mandalarts);
export const insertMandalartSchema = createInsertSchema(mandalarts);

export const selectMandalartCellSchema = createSelectSchema(mandalartCells);
export const insertMandalartCellSchema = createInsertSchema(mandalartCells, {
  position: (schema) => schema.int().min(1).max(8),
});

export const selectSettingsSchema = createSelectSchema(settings);
export const insertSettingsSchema = createInsertSchema(settings);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;
export type Mandalart = typeof mandalarts.$inferSelect;
export type NewMandalart = typeof mandalarts.$inferInsert;
export type MandalartCell = typeof mandalartCells.$inferSelect;
export type NewMandalartCell = typeof mandalartCells.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
