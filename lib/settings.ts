import { z } from "zod";

export const DEFAULT_SCHEDULE_ICON = "🗓️";
export const DEFAULT_TODO_ICON = "✅";

export const iconPreferencesSchema = z.object({
  scheduleIcon: z.string().trim().min(1, "아이콘을 입력해 주세요.").max(10, "아이콘이 너무 길어요."),
  todoIcon: z.string().trim().min(1, "아이콘을 입력해 주세요.").max(10, "아이콘이 너무 길어요."),
});

export type IconPreferencesInput = z.infer<typeof iconPreferencesSchema>;
export const BACKUP_PAYLOAD_VERSION = "1.2";

export type FullBackupPayload = {
  version: typeof BACKUP_PAYLOAD_VERSION;
  exportedAt: string;
  mandalarts: Array<{
    cells: Array<{
      goal: string;
      id: string;
      isCompleted: boolean;
      position: number;
    }>;
    coreGoal: string;
    id: string;
    userId: string;
  }>;
  routines: Array<{
    friCheck: boolean;
    id: string;
    monCheck: boolean;
    satCheck: boolean;
    sunCheck: boolean;
    thuCheck: boolean;
    title: string;
    tueCheck: boolean;
    userId: string;
    wedCheck: boolean;
  }>;
  settings: {
    scheduleIcon: string;
    todoIcon: string;
  } | null;
  tasks: Array<{
    date: Date;
    id: string;
    priority: string;
    progress: number;
    status: string;
    title: string;
    type: string;
    userId: string;
  }>;
  transactions: Array<{
    amount: number;
    category: string;
    date: Date;
    id: string;
    isRecurring: boolean;
    note: string | null;
    recurrenceDate: number | null;
    type: "INCOME" | "EXPENSE";
    userId: string;
  }>;
};

export function resolveIconPreferences(
  input?: Partial<IconPreferencesInput> | null,
): IconPreferencesInput {
  return {
    scheduleIcon: input?.scheduleIcon?.trim() || DEFAULT_SCHEDULE_ICON,
    todoIcon: input?.todoIcon?.trim() || DEFAULT_TODO_ICON,
  };
}
