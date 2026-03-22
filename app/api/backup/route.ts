import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, hasDatabaseUrl } from "@/lib/db";
import type { FullBackupPayload } from "@/lib/settings";
import { formatTimeZoneDateOnlyValue } from "@/lib/timezone-date";

export const dynamic = "force-dynamic";

function buildFilenameDate() {
  return formatTimeZoneDateOnlyValue(new Date(), "Asia/Seoul");
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      { error: "Database connection is not configured." },
      { status: 503 },
    );
  }

  const [transactions, tasks, routines, mandalarts, userSettings] = await Promise.all([
    db.query.transactions.findMany({
      orderBy: (table, { desc }) => [desc(table.date), desc(table.id)],
      where: (table, { eq }) => eq(table.userId, userId),
    }),
    db.query.tasks.findMany({
      orderBy: (table, { asc, desc }) => [asc(table.date), desc(table.progress)],
      where: (table, { eq }) => eq(table.userId, userId),
    }),
    db.query.routines.findMany({
      orderBy: (table, { asc }) => [asc(table.title)],
      where: (table, { eq }) => eq(table.userId, userId),
    }),
    db.query.mandalarts.findMany({
      orderBy: (table, { asc }) => [asc(table.coreGoal)],
      where: (table, { eq }) => eq(table.userId, userId),
      with: {
        cells: {
          orderBy: (table, { asc }) => [asc(table.position)],
        },
      },
    }),
    db.query.settings.findFirst({
      columns: { scheduleIcon: true, todoIcon: true },
      where: (table, { eq }) => eq(table.userId, userId),
    }),
  ]);

  const payload: FullBackupPayload = {
    exportedAt: new Date().toISOString(),
    mandalarts,
    routines,
    settings: userSettings ?? null,
    tasks,
    transactions,
    version: "1.0",
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="lifesync-backup-${buildFilenameDate()}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
