"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo } from "react";
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

export function MandalartBoard({ board }: { board: MandalartState | null }) {
  const selectedMandalartCellId = usePlannerStore((state) => state.selectedMandalartCellId);
  const selectMandalartCell = usePlannerStore((state) => state.selectMandalartCell);
  const selectedCell = useMemo(
    () => board?.cells.find((cell) => cell.id === selectedMandalartCellId) ?? null,
    [board, selectedMandalartCellId],
  );

  if (!board) {
    return (
      <p className="rounded-3xl bg-white p-8 text-sm text-muted-foreground shadow-sm">
        아직 만다라트 보드가 없어요.
      </p>
    );
  }

  return (
    <LayoutGroup>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid aspect-square min-w-0 grid-cols-3 grid-rows-3 gap-3">
          {board.cells.map((cell) => (
            <motion.button
              key={cell.id}
              type="button"
              layoutId={`mandalart-${cell.id}`}
              className={`rounded-3xl bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${positionToGrid[cell.position]}`}
              onClick={() => selectMandalartCell(cell.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{cell.position}칸</Badge>
                {cell.isCompleted ? <Badge variant="secondary">완료</Badge> : null}
              </div>
              <p className="mt-4 text-sm font-medium leading-6 text-slate-800">{cell.goal}</p>
            </motion.button>
          ))}
          <div className="col-start-2 row-start-2 flex items-center justify-center rounded-3xl bg-primary p-4 text-center text-primary-foreground shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-primary-foreground/80">핵심 목표</p>
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
                <p className="mt-6 text-sm text-muted-foreground">{selectedCell.position}번째 목표</p>
                <h2 className="mt-2 font-heading text-3xl text-slate-800">{selectedCell.goal}</h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  지금 집중할 목표를 크게 보고, 다음 행동을 더 또렷하게 정리해 보세요.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center rounded-3xl bg-white p-6 text-center text-sm leading-6 text-muted-foreground shadow-sm"
              >
                목표 칸을 눌러서 자세히 살펴보세요.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}
