"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import {
  createTask,
  deleteTask,
  updateTask,
  updateTaskProgress,
} from "@/actions/planner";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-4">
      <form className="grid gap-3 rounded-3xl bg-slate-50 p-4 sm:grid-cols-4" onSubmit={submitTaskForm}>
        <label className="flex flex-col gap-2 text-sm">
          <span>제목</span>
          <input
            value={draft.title}
            onChange={(event) => handleDraftChange("title", event.target.value)}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4"
            placeholder="할 일을 적어 주세요"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>날짜</span>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => handleDraftChange("date", event.target.value)}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>우선순위</span>
          <select
            value={draft.priority}
            onChange={(event) =>
              handleDraftChange("priority", event.target.value as TaskDraft["priority"])
            }
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4"
          >
            <option value="HIGH">중요</option>
            <option value="MEDIUM">보통</option>
            <option value="LOW">가볍게</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>유형</span>
          <select
            value={draft.type}
            onChange={(event) =>
              handleDraftChange("type", event.target.value as TaskDraft["type"])
            }
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4"
          >
            <option value="TASK">할 일</option>
            <option value="ROUTINE">루틴형</option>
          </select>
        </label>
        <div className="flex gap-2 sm:col-span-4">
          <Button type="submit" disabled={isPending}>
            {editingTask ? "할 일 저장하기" : "할 일 추가하기"}
          </Button>
          {editingTask ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              취소
            </Button>
          ) : null}
        </div>
      </form>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      {tasks.length === 0 ? (
        <p className="rounded-3xl bg-slate-50 p-5 text-sm text-muted-foreground">
          아직 할 일이 없어요.
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {tasks.map((task) => {
            const currentValue = task.progress;

            return (
              <div key={task.id} className="rounded-3xl bg-slate-50 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {formatKoreanDateLabel(task.date)} · {formatTaskTypeLabel(task.type)} ·{" "}
                      {formatTaskPriorityLabel(task.priority)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant="outline">{currentValue}%</Badge>
                    <Button type="button" variant="ghost" onClick={() => beginEdit(task)}>
                      수정
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => removeTask(task.id)}>
                      삭제
                    </Button>
                  </div>
                </div>
                <div className="rounded-2xl bg-white px-3 shadow-sm">
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
                {isPending ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    슬라이더를 놓는 순간 저장돼요.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
