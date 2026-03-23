"use client";

import { useState, useTransition } from "react";
import {
  createRoutine,
  deleteRoutine,
  toggleRoutineCheck,
  updateRoutine,
} from "@/actions/planner";
import { Button } from "@/components/ui/button";
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

export function RoutineTracker({ routines: initialRoutines }: { routines: RoutineOverviewItem[] }) {
  const [routines, setRoutines] = useState(initialRoutines);
  const [draftTitle, setDraftTitle] = useState("");
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitRoutine() {
    if (!draftTitle.trim()) {
      setErrorMessage("루틴 이름을 입력해 주세요.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        if (editingRoutineId) {
          const updatedRoutine = await updateRoutine(editingRoutineId, { title: draftTitle });
          setRoutines((current) =>
            current.map((routine) =>
              routine.id === updatedRoutine.id ? updatedRoutine : routine,
            ),
          );
        } else {
          const createdRoutine = await createRoutine({ title: draftTitle });
          setRoutines((current) =>
            [...current, createdRoutine].sort((left, right) => left.title.localeCompare(right.title, "ko")),
          );
        }
        setDraftTitle("");
        setEditingRoutineId(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "루틴을 저장하지 못했어요.");
      }
    });
  }

  function beginEdit(routine: RoutineOverviewItem) {
    setEditingRoutineId(routine.id);
    setDraftTitle(routine.title);
  }

  function resetForm() {
    setDraftTitle("");
    setEditingRoutineId(null);
  }

  function commitDayToggle(
    routine: RoutineOverviewItem,
    dayKey: keyof Pick<
      RoutineOverviewItem,
      "monCheck" | "tueCheck" | "wedCheck" | "thuCheck" | "friCheck" | "satCheck" | "sunCheck"
    >,
    checked: boolean,
  ) {
    const previousRoutine = routine;
    setRoutines((current) =>
      current.map((item) => (item.id === routine.id ? { ...item, [dayKey]: checked } : item)),
    );

    startTransition(async () => {
      try {
        const updatedRoutine = await toggleRoutineCheck(routine.id, dayKey, checked);
        setRoutines((current) =>
          current.map((item) => (item.id === updatedRoutine.id ? updatedRoutine : item)),
        );
      } catch (error) {
        setRoutines((current) =>
          current.map((item) => (item.id === previousRoutine.id ? previousRoutine : item)),
        );
        setErrorMessage(error instanceof Error ? error.message : "루틴 상태를 저장하지 못했어요.");
      }
    });
  }

  function removeRoutine(routineId: string) {
    const previousRoutines = routines;
    setRoutines((current) => current.filter((routine) => routine.id !== routineId));
    if (editingRoutineId === routineId) {
      resetForm();
    }

    startTransition(async () => {
      try {
        await deleteRoutine(routineId);
      } catch (error) {
        setRoutines(previousRoutines);
        setErrorMessage(error instanceof Error ? error.message : "루틴을 삭제하지 못했어요.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-4 sm:flex-row">
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4"
          placeholder="매일 반복할 루틴을 적어 주세요"
        />
        <div className="flex gap-2">
          <Button type="button" disabled={isPending} onClick={submitRoutine}>
            {editingRoutineId ? "루틴 저장하기" : "루틴 추가하기"}
          </Button>
          {editingRoutineId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              취소
            </Button>
          ) : null}
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      {routines.length === 0 ? (
        <p className="rounded-3xl bg-slate-50 p-5 text-sm text-muted-foreground">
          아직 루틴이 없어요.
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {routines.map((routine) => (
            <div key={routine.id} className="rounded-3xl bg-slate-50 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-medium">{routine.title}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => beginEdit(routine)}>
                    수정
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => removeRoutine(routine.id)}>
                    삭제
                  </Button>
                </div>
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
                          commitDayToggle(routine, day.key, event.target.checked);
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
