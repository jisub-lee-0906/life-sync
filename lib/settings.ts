import { z } from "zod";

export const DEFAULT_SCHEDULE_ICON = "🗓️";
export const DEFAULT_TODO_ICON = "✅";
export const BACKUP_PAYLOAD_VERSION = "1.2";

export const iconPreferencesSchema = z.object({
  scheduleIcon: z
    .string()
    .trim()
    .min(1, "아이콘을 입력해 주세요.")
    .max(10, "아이콘이 너무 길어요."),
  todoIcon: z
    .string()
    .trim()
    .min(1, "아이콘을 입력해 주세요.")
    .max(10, "아이콘이 너무 길어요."),
});

const backupTransactionSchema = z.object({
  amount: z.number().int().nonnegative(),
  category: z.string().trim().min(1).max(120),
  date: z.string().datetime(),
  derivedYearMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  id: z.string().uuid(),
  isRecurring: z.boolean(),
  note: z.string().nullable(),
  recurrenceDate: z.number().int().min(1).max(31).nullable(),
  sourceTransactionId: z.string().uuid().nullable(),
  type: z.enum(["INCOME", "EXPENSE"]),
  userId: z.string().uuid(),
});

const backupTaskSchema = z.object({
  date: z.string().datetime(),
  id: z.string().uuid(),
  priority: z.string().trim().min(1).max(64),
  progress: z.number().int().min(0).max(100),
  status: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(64),
  userId: z.string().uuid(),
});

const backupRoutineSchema = z.object({
  friCheck: z.boolean(),
  id: z.string().uuid(),
  monCheck: z.boolean(),
  satCheck: z.boolean(),
  sunCheck: z.boolean(),
  thuCheck: z.boolean(),
  title: z.string().trim().min(1).max(255),
  tueCheck: z.boolean(),
  userId: z.string().uuid(),
  wedCheck: z.boolean(),
});

const backupMandalartCellSchema = z.object({
  goal: z.string().trim().min(1).max(255),
  id: z.string().uuid(),
  isCompleted: z.boolean(),
  position: z.number().int().min(1).max(8),
});

const backupMandalartSchema = z.object({
  cells: z.array(backupMandalartCellSchema).length(8),
  coreGoal: z.string().trim().min(1).max(255),
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export const backupPayloadSchema = z.object({
  exportedAt: z.string().datetime(),
  mandalarts: z.array(backupMandalartSchema),
  routines: z.array(backupRoutineSchema),
  settings: iconPreferencesSchema.nullable(),
  tasks: z.array(backupTaskSchema),
  transactions: z.array(backupTransactionSchema),
  version: z.literal(BACKUP_PAYLOAD_VERSION),
});

export type IconPreferencesInput = z.infer<typeof iconPreferencesSchema>;
export type FullBackupPayload = z.infer<typeof backupPayloadSchema>;

export function resolveIconPreferences(
  input?: Partial<IconPreferencesInput> | null,
): IconPreferencesInput {
  return {
    scheduleIcon: input?.scheduleIcon?.trim() || DEFAULT_SCHEDULE_ICON,
    todoIcon: input?.todoIcon?.trim() || DEFAULT_TODO_ICON,
  };
}
