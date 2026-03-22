"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FinanceTransactionViewModel } from "@/actions/finance";
import { formatKoreanDateLabel } from "@/lib/timezone-date";

type TransactionItemProps = {
  item: FinanceTransactionViewModel;
  onDelete: (id: string) => Promise<void> | void;
};

const transactionTypeLabel = {
  EXPENSE: "지출",
  INCOME: "수입",
} as const;

export function TransactionItem({ item, onDelete }: TransactionItemProps) {
  return (
    <div
      className={`rounded-3xl bg-white p-5 shadow-sm transition-all duration-200 sm:p-6 ${
        item.isOptimistic ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.type === "EXPENSE" ? "outline" : "secondary"}>
              {transactionTypeLabel[item.type]}
            </Badge>
            {item.isRecurring ? <Badge variant="outline">반복</Badge> : null}
            {item.isOptimistic ? <Badge variant="outline">저장 중</Badge> : null}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{item.category}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {formatKoreanDateLabel(item.date)}
              {item.note ? ` · ${item.note}` : ""}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold tracking-tight text-slate-800">
            {item.amount.toLocaleString("ko-KR")}원
          </p>
          {!item.isOptimistic ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full sm:w-auto"
              onClick={() => onDelete(item.id)}
            >
              삭제
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
