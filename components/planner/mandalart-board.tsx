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
import { Badge } from "@/components/ui/badge";
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
      className="space-y-4 rounded-3xl bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        setErrorMessage(null);
        onSubmit({ coreGoal, cellGoals }).catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : "만다라트를 만들지 못했어요.");
        });
      }}
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-800">만다라트를 시작해 보세요</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          핵심 목표 1개와 세부 목표 8개를 먼저 적으면 바로 보드를 만들 수 있어요.
        </p>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span>핵심 목표</span>
        <input
          value={coreGoal}
          onChange={(event) => setCoreGoal(event.target.value)}
          className="min-h-11 rounded-2xl border border-slate-200 px-4"
          placeholder="이번에 가장 집중할 목표"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {cellGoals.map((goal, index) => (
          <label key={index} className="flex flex-col gap-2 text-sm">
            <span>{index + 1}번 목표</span>
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
              placeholder="세부 목표를 적어 주세요"
            />
          </label>
        ))}
      </div>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "만드는 중이에요" : "만다라트 만들기"}
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
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-5 shadow-sm">
          <input
            value={coreGoalDraft}
            onChange={(event) => setCoreGoalDraft(event.target.value)}
            className="min-h-11 flex-1 rounded-2xl border border-slate-200 px-4"
          />
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  const nextBoard = await updateMandalartCoreGoal({
                    coreGoal: coreGoalDraft,
                    mandalartId: board.id,
                  });
                  syncBoard(nextBoard);
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "핵심 목표를 저장하지 못했어요.");
                }
              });
            }}
          >
            핵심 목표 저장
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteMandalart(board.id);
                  syncBoard(null);
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "만다라트를 삭제하지 못했어요.");
                }
              });
            }}
          >
            보드 삭제
          </Button>
        </div>

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid aspect-square min-w-0 grid-cols-3 grid-rows-3 gap-3">
            {board.cells.map((cell) => (
              <motion.button
                key={cell.id}
                type="button"
                layoutId={`mandalart-${cell.id}`}
                className={`rounded-3xl bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${positionToGrid[cell.position]}`}
                onClick={() => {
                  selectMandalartCell(cell.id);
                  setCellGoalDraft(cell.goal);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{cell.position}번</Badge>
                  {cell.isCompleted ? <Badge variant="secondary">완료</Badge> : null}
                </div>
                <p className="mt-4 text-sm font-medium leading-6 text-slate-800">{cell.goal}</p>
              </motion.button>
            ))}
            <div className="col-start-2 row-start-2 flex items-center justify-center rounded-3xl bg-primary p-4 text-center text-primary-foreground shadow-sm sm:p-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-primary-foreground/80">
                  핵심 목표
                </p>
                <p className="mt-3 font-heading text-xl sm:text-2xl">{board.coreGoal}</p>
              </div>
            </div>
          </div>

          <div className="min-h-64 rounded-3xl bg-slate-50 p-4">
            <AnimatePresence mode="wait">
              {selectedCell ? (
                <motion.div
                  key={selectedCell.id}
                  layoutId={`mandalart-${selectedCell.id}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="h-full rounded-3xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge variant="outline">집중 보기</Badge>
                    <Button type="button" variant="ghost" onClick={() => selectMandalartCell(null)}>
                      닫기
                    </Button>
                  </div>
                  <p className="mt-6 text-sm text-muted-foreground">{selectedCell.position}번 목표</p>
                  <textarea
                    value={cellGoalDraft}
                    onChange={(event) => setCellGoalDraft(event.target.value)}
                    className="mt-3 min-h-32 w-full rounded-2xl border border-slate-200 p-4"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
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
                      }}
                    >
                      목표 저장
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            const nextBoard = await toggleMandalartCellCompleted({
                              cellId: selectedCell.id,
                              isCompleted: !selectedCell.isCompleted,
                            });
                            syncBoard(nextBoard);
                          } catch (error) {
                            setErrorMessage(error instanceof Error ? error.message : "완료 상태를 저장하지 못했어요.");
                          }
                        });
                      }}
                    >
                      {selectedCell.isCompleted ? "완료 해제" : "완료 표시"}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full items-center justify-center rounded-3xl bg-white p-6 text-center text-sm leading-6 text-muted-foreground shadow-sm"
                >
                  목표 칸을 눌러 자세히 살펴보세요.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
