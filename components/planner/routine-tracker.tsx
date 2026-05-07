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
            [...current, createdRoutine].sort((left, right) =>
              left.title.localeCompare(right.title, "ko"),
            ),
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
    <div className="space-y-5">
      <div className="space-y-4 rounded-[1.8rem] border border-slate-200/70 bg-slate-50/80 p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {editingRoutineId ? "루틴 수정" : "새 루틴"}
          </h3>
          <p className="mt-1 text-sm text-slate-400">매일 이어가고 싶은 한 가지부터 가볍게 시작해 보세요.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4"
            placeholder="예: 물 마시기, 10분 스트레칭"
          />
          <div className="flex gap-2">
            {editingRoutineId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                취소
              </Button>
            ) : null}
            <Button type="button" disabled={isPending} onClick={submitRoutine}>
              {isPending ? "저장하고 있어요" : editingRoutineId ? "저장하기" : "추가하기"}
            </Button>
          </div>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      </div>

      {routines.length === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-base font-semibold text-slate-700">아직 루틴이 없어요.</p>
          <p className="mt-2 text-sm text-slate-400">하나만 만들어도 매일 흐름이 훨씬 또렷해져요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div key={routine.id} className="rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{routine.title}</p>
                  <p className="mt-1 text-sm text-slate-400">이번 주에 체크한 흐름을 바로 볼 수 있어요.</p>
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => beginEdit(routine)}>
                    수정
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeRoutine(routine.id)}>
                    삭제
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2">
                {weekdays.map((day) => (
                  <label
                    key={day.key}
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-[1.3rem] border text-xs font-semibold transition-all duration-200 ${
                      routine[day.key]
                        ? "border-blue-100 bg-blue-50 text-primary"
                        : "border-slate-200/70 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <span>{day.label}</span>
                    <input
                      type="checkbox"
                      checked={routine[day.key]}
                      className="size-4 rounded border-slate-300"
                      onChange={(event) => {
                        commitDayToggle(routine, day.key, event.target.checked);
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
