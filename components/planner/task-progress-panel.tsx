"use client";

import { useState, useTransition } from "react";
import { updateTaskProgress } from "@/actions/planner";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { formatKoreanDateLabel } from "@/lib/timezone-date";
import type { TaskOverviewItem } from "@/lib/planner";

const taskTypeLabel = {
  ROUTINE: "루틴",
  TASK: "할 일",
} as const;

const taskPriorityLabel = {
  HIGH: "중요",
  LOW: "가볍게",
  MEDIUM: "보통",
} as const;

export function TaskProgressPanel({ tasks }: { tasks: TaskOverviewItem[] }) {
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>(
    Object.fromEntries(tasks.map((task) => [task.id, task.progress])),
  );
  const [isPending, startTransition] = useTransition();

  function readSliderValue(value: number | readonly number[]) {
    return Array.isArray(value) ? (value[0] ?? 0) : value;
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-3xl bg-slate-50 p-5 text-sm text-muted-foreground">
        아직 할 일이 없어요.
      </p>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {tasks.map((task) => {
        const currentValue = taskProgress[task.id] ?? task.progress;

        return (
          <div key={task.id} className="rounded-3xl bg-slate-50 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{task.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {formatKoreanDateLabel(task.date)} ·{" "}
                  {taskTypeLabel[task.type as keyof typeof taskTypeLabel] ?? task.type} ·{" "}
                  {taskPriorityLabel[task.priority as keyof typeof taskPriorityLabel] ?? task.priority}
                </p>
              </div>
              <Badge variant="outline" className="self-start sm:self-auto">
                {currentValue}%
              </Badge>
            </div>
            <div className="rounded-2xl bg-white px-3 shadow-sm">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[currentValue]}
                onValueChange={(values) => {
                  const nextValue = readSliderValue(values);
                  setTaskProgress((current) => ({
                    ...current,
                    [task.id]: nextValue,
                  }));
                }}
                onValueCommitted={(values) => {
                  const committedValue = readSliderValue(values);
                  startTransition(async () => {
                    await updateTaskProgress(task.id, committedValue);
                  });
                }}
              />
            </div>
            {isPending ? (
              <p className="mt-2 text-xs text-muted-foreground">
                슬라이더를 놓는 순간 저장돼요.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
