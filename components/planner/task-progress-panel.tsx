"use client";

import { useState, useTransition } from "react";
import { updateTaskProgress } from "@/actions/planner";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import type { TaskOverviewItem } from "@/lib/planner";

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
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        No tasks yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {tasks.map((task) => {
        const currentValue = taskProgress[task.id] ?? task.progress;

        return (
          <div key={task.id} className="rounded-3xl border p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{task.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {task.date} · {task.type} · {task.priority}
                </p>
              </div>
              <Badge variant="outline" className="self-start sm:self-auto">
                {currentValue}%
              </Badge>
            </div>
            <div className="rounded-2xl bg-muted/35 px-3">
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
                Saved only when you release the slider.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
