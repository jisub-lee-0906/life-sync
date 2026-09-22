import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AccessDeniedError, requireApprovedUser } from "@/lib/server-auth";
import { BACKUP_PAYLOAD_VERSION, type FullBackupPayload } from "@/lib/settings";
import { formatTimeZoneDateOnlyValue } from "@/lib/timezone-date";

export const dynamic = "force-dynamic";

function buildFilenameDate() {
  return formatTimeZoneDateOnlyValue(new Date(), "Asia/Seoul");
}

export async function GET() {
  let userId: string;
  try {
    userId = (await requireApprovedUser()).id;
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "데이터베이스 연결을 확인해 주세요." },
      { status: 503 },
    );
  }

  const [transactions, transactionCategories, tasks, routines, mandalarts, userSettings] =
    await Promise.all([
    db.query.transactions.findMany({
      orderBy: (table, { desc }) => [desc(table.date), desc(table.id)],
      where: (table, { eq }) => eq(table.userId, userId),
    }),
    db.query.transactionCategories.findMany({
      orderBy: (table, { asc }) => [asc(table.type), asc(table.sortOrder), asc(table.name)],
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
    mandalarts: mandalarts.map((board) => ({
      cells: board.cells.map((cell) => ({
        goal: cell.goal,
        id: cell.id,
        isCompleted: cell.isCompleted,
        position: cell.position,
      })),
      coreGoal: board.coreGoal,
      id: board.id,
      userId: board.userId,
    })),
    routines: routines.map((routine) => ({
      friCheck: routine.friCheck,
      id: routine.id,
      monCheck: routine.monCheck,
      satCheck: routine.satCheck,
      sunCheck: routine.sunCheck,
      thuCheck: routine.thuCheck,
      title: routine.title,
      tueCheck: routine.tueCheck,
      userId: routine.userId,
      wedCheck: routine.wedCheck,
    })),
    settings: userSettings ?? null,
    tasks: tasks.map((task) => ({
      date: task.date.toISOString(),
      id: task.id,
      priority: task.priority,
      progress: task.progress,
      status: task.status,
      title: task.title,
      type: task.type,
      userId: task.userId,
    })),
    transactionCategories: transactionCategories.map((category) => ({
      archivedAt: category.archivedAt?.toISOString() ?? null,
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      type: category.type,
      userId: category.userId,
    })),
    transactions: transactions.map((transaction) => ({
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date.toISOString(),
      derivedYearMonth: transaction.derivedYearMonth,
      id: transaction.id,
      isRecurring: transaction.isRecurring,
      note: transaction.note,
      recurrenceDate: transaction.recurrenceDate,
      sourceTransactionId: transaction.sourceTransactionId,
      type: transaction.type,
      userId: transaction.userId,
    })),
    version: BACKUP_PAYLOAD_VERSION,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="lifesync-backup-${buildFilenameDate()}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
    },
  });
}
