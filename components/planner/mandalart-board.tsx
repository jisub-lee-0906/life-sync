"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import {
  createMandalart,
  deleteMandalart,
  toggleMandalartCellCompleted,
  updateMandalartCell,
  updateMandalartCoreGoal,
} from "@/actions/planner";
import { Button } from "@/components/ui/button";
import type { MandalartState } from "@/lib/planner";
import { usePlannerStore } from "@/store";

const positionToGrid: Record<number, string> = {
  1: "col-start-1 row-start-1",
  2: "col-start-2 row-start-1",
  3: "col-start-3 row-start-1",
  4: "col-start-1 row-start-2",
  5: "col-start-3 row-start-2",
  6: "col-start-1 row-start-3",
  7: "col-start-2 row-start-3",
  8: "col-start-3 row-start-3",
};

function validateBoardDraft(input: { coreGoal: string; cellGoals: string[] }) {
  if (!input.coreGoal.trim()) {
    return "중심 목표를 입력해 주세요.";
  }

  const emptyCellIndex = input.cellGoals.findIndex((goal) => !goal.trim());
  if (emptyCellIndex >= 0) {
    return `${emptyCellIndex + 1}번 목표를 입력해 주세요.`;
  }

  return null;
}

function EmptyBoard({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (input: { coreGoal: string; cellGoals: string[] }) => Promise<void>;
}) {
  const [coreGoal, setCoreGoal] = useState("");
  const [cellGoals, setCellGoals] = useState(Array.from({ length: 8 }, () => ""));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-5 rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
      onSubmit={(event) => {
        event.preventDefault();
        const nextInput = { cellGoals, coreGoal };
        const validationError = validateBoardDraft(nextInput);

        if (validationError) {
          setErrorMessage(validationError);
          return;
        }

        setErrorMessage(null);
        onSubmit(nextInput).catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : "만다라트를 만들지 못했어요.");
        });
      }}
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">처음 목표를 채워볼까요?</h2>
        <p className="text-sm leading-6 text-slate-400">
          중심 목표 하나와 주변 목표 여덟 개만 적으면 바로 보드를 만들 수 있어요.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-slate-500">중심 목표</span>
        <input
          value={coreGoal}
          onChange={(event) => setCoreGoal(event.target.value)}
          className="min-h-11 rounded-2xl border border-slate-200 px-4"
          placeholder="이번에 가장 집중하고 싶은 목표"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {cellGoals.map((goal, index) => (
          <label key={index} className="flex flex-col gap-2 text-sm">
            <span className="text-slate-500">{index + 1}번 목표</span>
            <input
              value={goal}
              onChange={(event) =>
                setCellGoals((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              className="min-h-11 rounded-2xl border border-slate-200 px-4"
              placeholder="작게 쪼갠 목표를 적어 주세요"
            />
          </label>
        ))}
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "만들고 있어요" : "만다라트 만들기"}
      </Button>
    </form>
  );
}

export function MandalartBoard({ board: initialBoard }: { board: MandalartState | null }) {
  const [board, setBoard] = useState(initialBoard);
  const [coreGoalDraft, setCoreGoalDraft] = useState(initialBoard?.coreGoal ?? "");
  const [cellGoalDraft, setCellGoalDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectedMandalartCellId = usePlannerStore((state) => state.selectedMandalartCellId);
  const selectMandalartCell = usePlannerStore((state) => state.selectMandalartCell);
  const selectedCell = useMemo(
    () => board?.cells.find((cell) => cell.id === selectedMandalartCellId) ?? null,
    [board, selectedMandalartCellId],
  );

  function syncBoard(nextBoard: MandalartState | null) {
    setBoard(nextBoard);
    setCoreGoalDraft(nextBoard?.coreGoal ?? "");
    if (!nextBoard) {
      setCellGoalDraft("");
      selectMandalartCell(null);
      return;
    }
    const nextSelectedCell = nextBoard.cells.find((cell) => cell.id === selectedMandalartCellId);
    setCellGoalDraft(nextSelectedCell?.goal ?? "");
  }

  function saveCoreGoal() {
    if (!coreGoalDraft.trim()) {
      setErrorMessage("중심 목표를 입력해 주세요.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const nextBoard = await updateMandalartCoreGoal({
          coreGoal: coreGoalDraft,
          mandalartId: board!.id,
        });
        syncBoard(nextBoard);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "중심 목표를 저장하지 못했어요.");
      }
    });
  }

  function saveSelectedCell() {
    if (!selectedCell) return;

    if (!cellGoalDraft.trim()) {
      setErrorMessage("목표를 입력해 주세요.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const nextBoard = await updateMandalartCell({
          cellId: selectedCell.id,
          goal: cellGoalDraft,
        });
        syncBoard(nextBoard);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "목표를 저장하지 못했어요.");
      }
    });
  }

  if (!board) {
    return (
      <EmptyBoard
        isPending={isPending}
        onSubmit={async (input) => {
          startTransition(async () => {
            try {
              const nextBoard = await createMandalart(input);
              syncBoard(nextBoard);
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : "만다라트를 만들지 못했어요.");
            }
          });
        }}
      />
    );
  }

  return (
    <LayoutGroup>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-sm">
          <input
            value={coreGoalDraft}
            onChange={(event) => setCoreGoalDraft(event.target.value)}
            className="min-h-11 flex-1 rounded-2xl border border-slate-200 px-4"
          />
          <Button type="button" disabled={isPending} onClick={saveCoreGoal}>
            저장하기
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setErrorMessage(null);
              startTransition(async () => {
                try {
                  await deleteMandalart(board.id);
                  syncBoard(null);
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "보드를 삭제하지 못했어요.");
                }
              });
            }}
          >
            보드 삭제
          </Button>
        </div>

        {errorMessage ? (
          <div className="rounded-[1.6rem] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid aspect-square min-w-0 grid-cols-3 grid-rows-3 gap-3">
            {board.cells.map((cell) => {
              const isSelected = selectedCell?.id === cell.id;

              return (
                <motion.button
                  key={cell.id}
                  type="button"
                  layoutId={`mandalart-${cell.id}`}
                  className={`rounded-[1.8rem] border p-4 text-left transition-all duration-200 sm:p-5 ${
                    isSelected
                      ? "border-primary bg-blue-50 shadow-[0_16px_28px_rgba(0,64,255,0.12)]"
                      : "border-slate-200/70 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  } ${positionToGrid[cell.position]}`}
                  onClick={() => {
                    setErrorMessage(null);
                    selectMandalartCell(cell.id);
                    setCellGoalDraft(cell.goal);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">{cell.position}</span>
                    {cell.isCompleted ? (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[0.72rem] font-semibold text-primary">
                        완료
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-5 text-sm font-medium leading-6 text-slate-800">{cell.goal}</p>
                </motion.button>
              );
            })}

            <div className="col-start-2 row-start-2 flex items-center justify-center rounded-[1.8rem] bg-slate-900 p-5 text-center text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)]">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-white/55 uppercase">
                  중심 목표
                </p>
                <p className="mt-3 font-heading text-xl font-semibold leading-snug sm:text-2xl">
                  {board.coreGoal}
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-64 rounded-[1.9rem] border border-slate-200/70 bg-slate-50 p-4">
            <AnimatePresence mode="wait">
              {selectedCell ? (
                <motion.div
                  key={selectedCell.id}
                  layoutId={`mandalart-${selectedCell.id}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="h-full rounded-[1.7rem] border border-slate-200/70 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
                        자세히 보기
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {selectedCell.position}번 목표
                      </p>
                    </div>
                    <Button type="button" variant="ghost" onClick={() => selectMandalartCell(null)}>
                      닫기
                    </Button>
                  </div>

                  <textarea
                    value={cellGoalDraft}
                    onChange={(event) => setCellGoalDraft(event.target.value)}
                    className="mt-5 min-h-36 w-full rounded-[1.5rem] border border-slate-200 p-4"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" disabled={isPending} onClick={saveSelectedCell}>
                      저장하기
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setErrorMessage(null);
                        startTransition(async () => {
                          try {
                            const nextBoard = await toggleMandalartCellCompleted({
                              cellId: selectedCell.id,
                              isCompleted: !selectedCell.isCompleted,
                            });
                            syncBoard(nextBoard);
                          } catch (error) {
                            setErrorMessage(
                              error instanceof Error
                                ? error.message
                                : "완료 상태를 저장하지 못했어요.",
                            );
                          }
                        });
                      }}
                    >
                      {selectedCell.isCompleted ? "완료 해제" : "완료로 표시"}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full items-center justify-center rounded-[1.7rem] border border-dashed border-slate-200 bg-white px-6 text-center"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-700">하나를 골라 자세히 보세요</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      바깥 목표를 누르면 내용을 더 자세히 다듬을 수 있어요.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
