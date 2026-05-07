import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";
import { loadTestEnv } from "./env";

loadTestEnv();

const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("E2E_DATABASE_URL or DATABASE_URL is required for Playwright E2E tests.");
}

const client = postgres(connectionString, {
  connect_timeout: 5,
  idle_timeout: 0,
  max: 1,
  prepare: false,
});

export const e2eDb = drizzle(client, { schema });

export type TestIdentity = {
  email: string;
  name: string;
  userId: string;
};

export type TransactionSeed = {
  amount: number;
  category: string;
  date: string;
  isRecurring?: boolean;
  note?: string | null;
  recurrenceDate?: number | null;
  type: "INCOME" | "EXPENSE";
};

export type TaskSeed = {
  date: string;
  priority: string;
  progress?: number;
  status?: string;
  title: string;
  type: string;
};

export type RoutineSeed = {
  friCheck?: boolean;
  monCheck?: boolean;
  satCheck?: boolean;
  sunCheck?: boolean;
  thuCheck?: boolean;
  title: string;
  tueCheck?: boolean;
  wedCheck?: boolean;
};

export type PendingUserSeed = {
  email?: string;
  name: string;
};

export function createTestIdentity(name = "LifeSync E2E User"): TestIdentity {
  const userId = randomUUID();
  return {
    email: `e2e-${userId}@example.com`,
    name,
    userId,
  };
}

function toDateOnly(date: string) {
  return new Date(`${date}T00:00:00.000+09:00`);
}

function toTimestamp(date: string) {
  return new Date(`${date}T12:00:00.000+09:00`);
}

export class TestDataManager {
  private readonly ownedUserIds = new Set<string>();

  constructor(private readonly identity: TestIdentity) {
    this.ownedUserIds.add(identity.userId);
  }

  async ensureUser() {
    await e2eDb.insert(schema.users).values({
      email: this.identity.email,
      id: this.identity.userId,
      name: this.identity.name,
      role: "USER",
      status: "APPROVED",
    }).onConflictDoNothing();
  }

  async seedTransactions(rows: TransactionSeed[]) {
    await this.ensureUser();

    if (rows.length === 0) {
      return [];
    }

    return e2eDb.insert(schema.transactions).values(
      rows.map((row) => ({
        amount: row.amount,
        category: row.category,
        date: toTimestamp(row.date),
        isRecurring: row.isRecurring ?? false,
        note: row.note ?? null,
        recurrenceDate: row.recurrenceDate ?? null,
        type: row.type,
        userId: this.identity.userId,
      })),
    ).returning();
  }

  async seedTasks(rows: TaskSeed[]) {
    await this.ensureUser();

    if (rows.length === 0) {
      return [];
    }

    return e2eDb.insert(schema.tasks).values(
      rows.map((row) => ({
        date: toDateOnly(row.date),
        priority: row.priority,
        progress: row.progress ?? 0,
        status: row.status ?? ((row.progress ?? 0) >= 100 ? "COMPLETED" : "IN_PROGRESS"),
        title: row.title,
        type: row.type,
        userId: this.identity.userId,
      })),
    ).returning();
  }

  async seedRoutines(rows: RoutineSeed[]) {
    await this.ensureUser();

    if (rows.length === 0) {
      return [];
    }

    return e2eDb.insert(schema.routines).values(
      rows.map((row) => ({
        friCheck: row.friCheck ?? false,
        monCheck: row.monCheck ?? false,
        satCheck: row.satCheck ?? false,
        sunCheck: row.sunCheck ?? false,
        thuCheck: row.thuCheck ?? false,
        title: row.title,
        tueCheck: row.tueCheck ?? false,
        userId: this.identity.userId,
        wedCheck: row.wedCheck ?? false,
      })),
    ).returning();
  }

  async seedMandalart(input: {
    cells: Array<{ goal: string; isCompleted?: boolean; position: number }>;
    coreGoal: string;
  }) {
    await this.ensureUser();

    const [board] = await e2eDb.insert(schema.mandalarts).values({
      coreGoal: input.coreGoal,
      userId: this.identity.userId,
    }).returning();

    if (!board) {
      throw new Error("Failed to create mandalart board.");
    }

    const cells = await e2eDb.insert(schema.mandalartCells).values(
      input.cells.map((cell) => ({
        goal: cell.goal,
        isCompleted: cell.isCompleted ?? false,
        mandalartId: board.id,
        position: cell.position,
      })),
    ).returning();

    return { board, cells };
  }

  async seedSettings(input: { scheduleIcon: string; todoIcon: string }) {
    await this.ensureUser();

    return e2eDb.insert(schema.settings).values({
      scheduleIcon: input.scheduleIcon,
      todoIcon: input.todoIcon,
      userId: this.identity.userId,
    }).onConflictDoUpdate({
      set: {
        scheduleIcon: input.scheduleIcon,
        todoIcon: input.todoIcon,
      },
      target: schema.settings.userId,
    }).returning();
  }

  async seedPendingUsers(rows: PendingUserSeed[]) {
    const inserted = [];

    for (const row of rows) {
      const id = randomUUID();
      this.ownedUserIds.add(id);
      const [user] = await e2eDb.insert(schema.users).values({
        email: row.email ?? `pending-${id}@example.com`,
        id,
        name: row.name,
        role: "USER",
        status: "PENDING",
      }).returning();

      inserted.push(user);
    }

    return inserted;
  }

  async readSettings() {
    return e2eDb.query.settings.findFirst({
      where: (table, operators) => operators.eq(table.userId, this.identity.userId),
    });
  }

  async readTransactions() {
    return e2eDb.query.transactions.findMany({
      orderBy: (table, operators) => [operators.desc(table.date), operators.desc(table.id)],
      where: (table, operators) => operators.eq(table.userId, this.identity.userId),
    });
  }

  async cleanup() {
    for (const userId of [...this.ownedUserIds]) {
      await e2eDb.delete(schema.settings).where(eq(schema.settings.userId, userId));
      await e2eDb.delete(schema.mandalarts).where(eq(schema.mandalarts.userId, userId));
      await e2eDb.delete(schema.routines).where(eq(schema.routines.userId, userId));
      await e2eDb.delete(schema.tasks).where(eq(schema.tasks.userId, userId));
      await e2eDb.delete(schema.transactions).where(eq(schema.transactions.userId, userId));
      await e2eDb.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
      await e2eDb.delete(schema.users).where(eq(schema.users.id, userId));
    }
  }
}
