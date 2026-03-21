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
    return <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No mandalart board found for this account.</p>;
  }

  return (
    <LayoutGroup>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid aspect-square grid-cols-3 grid-rows-3 gap-3">
          {board.cells.map((cell) => (
            <motion.button
              key={cell.id}
              type="button"
              layoutId={`mandalart-${cell.id}`}
              className={`rounded-3xl border p-4 text-left ${positionToGrid[cell.position]}`}
              onClick={() => selectMandalartCell(cell.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">#{cell.position}</Badge>
                {cell.isCompleted ? <Badge variant="secondary">Done</Badge> : null}
              </div>
              <p className="mt-4 text-sm font-medium leading-6">{cell.goal}</p>
            </motion.button>
          ))}
          <div className="col-start-2 row-start-2 flex items-center justify-center rounded-3xl border bg-primary/8 p-6 text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Core Goal</p>
              <p className="mt-3 font-heading text-2xl">{board.coreGoal}</p>
            </div>
          </div>
        </div>

        <div className="min-h-72 rounded-3xl border bg-muted/30 p-4">
          <AnimatePresence mode="wait">
            {selectedCell ? (
              <motion.div
                key={selectedCell.id}
                layoutId={`mandalart-${selectedCell.id}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="h-full rounded-3xl border bg-background p-6"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Focus node</Badge>
                  <Button type="button" variant="ghost" onClick={() => selectMandalartCell(null)}>
                    Close
                  </Button>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">Position {selectedCell.position}</p>
                <h2 className="mt-2 font-heading text-3xl">{selectedCell.goal}</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                  Step 5 keeps drill-down to a single focused zoom view without changing the schema.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center text-sm text-muted-foreground"
              >
                Select a mandalart cell to zoom into its detail view.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}
