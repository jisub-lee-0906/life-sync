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
    return <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No routines yet.</p>;
  }

  return (
    <div className="space-y-3">
      {routines.map((routine) => (
        <div key={routine.id} className="rounded-2xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">{routine.title}</p>
            {isPending ? <span className="text-xs text-muted-foreground">Updating...</span> : null}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((day) => (
              <label key={day.key} className="flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs">
                <span>{day.label}</span>
                <input
                  type="checkbox"
                  checked={routine[day.key]}
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
      ))}
    </div>
  );
}
