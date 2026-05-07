"use client";

import type { FinanceTransactionViewModel } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { formatKoreanDateLabel } from "@/lib/timezone-date";

type TransactionItemProps = {
  item: FinanceTransactionViewModel;
  onDelete: (id: string) => Promise<void> | void;
  onEdit: (item: FinanceTransactionViewModel) => void;
};

const transactionTypeLabel = {
  EXPENSE: "지출",
  INCOME: "수입",
} as const;

export function TransactionItem({ item, onDelete, onEdit }: TransactionItemProps) {
  return (
    <div
      className={`rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-200 sm:p-6 ${
        item.isOptimistic ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
                item.type === "EXPENSE"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-blue-50 text-primary"
              }`}
            >
              {transactionTypeLabel[item.type]}
            </span>
            {item.isRecurring ? (
              <span className="text-xs text-slate-400">반복 원본</span>
            ) : null}
            {item.sourceTransactionId ? (
              <span className="text-xs text-slate-400">자동 생성</span>
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{item.category}</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {formatKoreanDateLabel(item.date)}
              {item.note ? ` · ${item.note}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
          <p className="text-[1.75rem] font-semibold tracking-tight text-slate-900 sm:text-[1.9rem]">
            {item.amount.toLocaleString("ko-KR")}원
          </p>

          {!item.isOptimistic ? (
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(item)}>
                수정
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
                삭제
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
