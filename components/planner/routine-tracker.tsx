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
  { key: "monCheck", label: "월" },
  { key: "tueCheck", label: "화" },
  { key: "wedCheck", label: "수" },
  { key: "thuCheck", label: "목" },
  { key: "friCheck", label: "금" },
  { key: "satCheck", label: "토" },
  { key: "sunCheck", label: "일" },
];

export function RoutineTracker({ routines }: { routines: RoutineOverviewItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (routines.length === 0) {
    return (
      <p className="rounded-3xl bg-slate-50 p-5 text-sm text-muted-foreground">
        아직 루틴이 없어요.
      </p>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {routines.map((routine) => (
        <div key={routine.id} className="rounded-3xl bg-slate-50 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-medium">{routine.title}</p>
            {isPending ? (
              <span className="text-xs text-muted-foreground">반영하고 있어요.</span>
            ) : null}
          </div>
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="grid min-w-[28rem] grid-cols-7 gap-2 px-1">
              {weekdays.map((day) => (
                <label
                  key={day.key}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-white px-2 py-3 text-xs shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
