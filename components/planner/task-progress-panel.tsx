"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import {
  createTask,
  deleteTask,
  updateTask,
  updateTaskProgress,
} from "@/actions/planner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  formatTaskPriorityLabel,
  formatTaskTypeLabel,
  taskPriorityValues,
  taskTypeValues,
  type TaskOverviewItem,
} from "@/lib/planner";
import { formatDateInputValue } from "@/lib/finance";
import { formatKoreanDateLabel } from "@/lib/timezone-date";

type TaskDraft = {
  date: string;
  priority: (typeof taskPriorityValues)[number];
  title: string;
  type: (typeof taskTypeValues)[number];
};

function buildEmptyDraft(): TaskDraft {
  return {
    date: formatDateInputValue(new Date()),
    priority: "MEDIUM",
    title: "",
    type: "TASK",
  };
}

export function TaskProgressPanel({ tasks: initialTasks }: { tasks: TaskOverviewItem[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [draft, setDraft] = useState<TaskDraft>(buildEmptyDraft());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingTask = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) ?? null,
    [editingTaskId, tasks],
  );

  function readSliderValue(value: number | readonly number[]) {
    return Array.isArray(value) ? (value[0] ?? 0) : value;
  }

  function sortTasks(items: TaskOverviewItem[]) {
    return [...items].sort((left, right) => {
      const dateComparison = left.date.localeCompare(right.date);
      if (dateComparison !== 0) return dateComparison;
      if (left.progress !== right.progress) return right.progress - left.progress;
      return left.title.localeCompare(right.title, "ko");
    });
  }

  function handleDraftChange<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function beginEdit(task: TaskOverviewItem) {
    setEditingTaskId(task.id);
    setDraft({
      date: task.date,
      priority: task.priority as TaskDraft["priority"],
      title: task.title,
      type: task.type as TaskDraft["type"],
    });
  }

  function resetForm() {
    setDraft(buildEmptyDraft());
    setEditingTaskId(null);
  }

  function submitTaskForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!draft.title.trim()) {
      setErrorMessage("할 일 제목을 입력해 주세요.");
      return;
    }

    if (!draft.date.trim()) {
      setErrorMessage("날짜를 확인해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        if (editingTask) {
          const updatedTask = await updateTask(editingTask.id, draft);
          setTasks((current) =>
            sortTasks(current.map((task) => (task.id === updatedTask.id ? updatedTask : task))),
          );
        } else {
          const createdTask = await createTask(draft);
          setTasks((current) => sortTasks([...current, createdTask]));
        }
        resetForm();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "할 일을 저장하지 못했어요.");
      }
    });
  }

  function commitProgress(task: TaskOverviewItem, nextProgress: number) {
    const roundedProgress = Math.round(nextProgress);
    const previousTask = task;

    setTasks((current) =>
      sortTasks(
        current.map((item) =>
          item.id === task.id
            ? {
                ...item,
                progress: roundedProgress,
                status: roundedProgress >= 100 ? "COMPLETED" : "IN_PROGRESS",
              }
            : item,
        ),
      ),
    );

    startTransition(async () => {
      try {
        const updatedTask = await updateTaskProgress(task.id, roundedProgress);
        setTasks((current) =>
          sortTasks(current.map((item) => (item.id === updatedTask.id ? updatedTask : item))),
        );
      } catch (error) {
        setTasks((current) =>
          sortTasks(current.map((item) => (item.id === previousTask.id ? previousTask : item))),
        );
        setErrorMessage(error instanceof Error ? error.message : "진행률을 저장하지 못했어요.");
      }
    });
  }

  function removeTask(taskId: string) {
    const previousTasks = tasks;
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      resetForm();
    }

    startTransition(async () => {
      try {
        await deleteTask(taskId);
      } catch (error) {
        setTasks(previousTasks);
        setErrorMessage(error instanceof Error ? error.message : "할 일을 삭제하지 못했어요.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <form
        className="space-y-4 rounded-[1.8rem] border border-slate-200/70 bg-slate-50/80 p-5"
        onSubmit={submitTaskForm}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingTask ? "할 일 수정" : "새 할 일"}
          </h3>
          <p className="text-sm text-slate-400">제목부터 적고, 필요한 항목만 가볍게 고르면 충분해요.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px_150px]">
          <input
            value={draft.title}
            onChange={(event) => handleDraftChange("title", event.target.value)}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4"
            placeholder="오늘 해야 할 일을 적어 주세요."
          />
          <input
            type="date"
            value={draft.date}
            onChange={(event) => handleDraftChange("date", event.target.value)}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4"
          />
          <select
            value={draft.priority}
            onChange={(event) =>
              handleDraftChange("priority", event.target.value as TaskDraft["priority"])
            }
            className="select-field min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4"
          >
            <option value="HIGH">중요</option>
            <option value="MEDIUM">보통</option>
            <option value="LOW">가볍게</option>
          </select>
          <select
            value={draft.type}
            onChange={(event) =>
              handleDraftChange("type", event.target.value as TaskDraft["type"])
            }
            className="select-field min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4"
          >
            <option value="TASK">할 일</option>
            <option value="ROUTINE">루틴형</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : (
              <p className="text-sm text-slate-400">진행률은 아래 목록에서 바로 조절할 수 있어요.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {editingTask ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                취소
              </Button>
            ) : null}
            <Button type="submit" disabled={isPending}>
              {isPending ? "저장하고 있어요" : editingTask ? "저장하기" : "추가하기"}
            </Button>
          </div>
        </div>
      </form>

      {tasks.length === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-base font-semibold text-slate-700">아직 할 일이 없어요.</p>
          <p className="mt-2 text-sm text-slate-400">위에서 먼저 한 개만 적어도 충분히 시작할 수 있어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const currentValue = task.progress;

            return (
              <div key={task.id} className="rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {formatKoreanDateLabel(task.date)} · {formatTaskTypeLabel(task.type)} ·{" "}
                      {formatTaskPriorityLabel(task.priority)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-semibold text-slate-600">
                      {currentValue}%
                    </span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => beginEdit(task)}>
                      수정
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeTask(task.id)}>
                      삭제
                    </Button>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-slate-100 bg-slate-50 px-4 py-3">
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[currentValue]}
                    onValueCommitted={(values) => {
                      const committedValue = readSliderValue(values);
                      commitProgress(task, committedValue);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
