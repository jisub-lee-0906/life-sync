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
    return <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No tasks yet.</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const currentValue = taskProgress[task.id] ?? task.progress;

        return (
          <div key={task.id} className="rounded-2xl border p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">
                  {task.date} · {task.type} · {task.priority}
                </p>
              </div>
              <Badge variant="outline">{currentValue}%</Badge>
            </div>
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
