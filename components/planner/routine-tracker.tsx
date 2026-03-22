"use client";

import { useTransition } from "react";
import { toggleRoutineCheck } from "@/actions/planner";
import type { RoutineOverviewItem } from "@/lib/planner";

const weekdays: Array<{
  key: keyof Pick<
    RoutineOverviewItem,
    "monCheck" | "tueCheck" | "wedCheck" | "thuCheck" | "friCheck" | "satCheck" | "sunCheck"
  >;
  label: string;
}> = [
  { key: "monCheck", label: "Mon" },
  { key: "tueCheck", label: "Tue" },
  { key: "wedCheck", label: "Wed" },
  { key: "thuCheck", label: "Thu" },
  { key: "friCheck", label: "Fri" },
  { key: "satCheck", label: "Sat" },
  { key: "sunCheck", label: "Sun" },
];

export function RoutineTracker({ routines }: { routines: RoutineOverviewItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (routines.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        No routines yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {routines.map((routine) => (
        <div key={routine.id} className="rounded-3xl border p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-medium">{routine.title}</p>
            {isPending ? <span className="text-xs text-muted-foreground">Updating...</span> : null}
          </div>
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="grid min-w-[28rem] grid-cols-7 gap-2 px-1">
              {weekdays.map((day) => (
                <label
                  key={day.key}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-xs transition hover:border-primary/30 hover:bg-muted/30"
                >
                  <span>{day.label}</span>
                  <input
                    type="checkbox"
                    checked={routine[day.key]}
                    className="size-5 rounded border"
                    onChange={(event) => {
                      const checked = event.target.checked;
                      startTransition(async () => {
                        await toggleRoutineCheck(routine.id, day.key, checked);
                      });
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
