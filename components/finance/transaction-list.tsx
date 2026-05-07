"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import type { FinanceTransactionViewModel } from "@/actions/finance";
import { TransactionItem } from "@/components/finance/transaction-item";

type TransactionListProps = {
  hasMore: boolean;
  isLoadingMore: boolean;
  items: FinanceTransactionViewModel[];
  onDelete: (id: string) => Promise<void> | void;
  onEdit: (item: FinanceTransactionViewModel) => void;
  onLoadMore: () => Promise<void> | void;
};

export function TransactionList({
  hasMore,
  isLoadingMore,
  items,
  onDelete,
  onEdit,
  onLoadMore,
}: TransactionListProps) {
  const { inView, ref } = useInView({
    rootMargin: "240px",
  });

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      void onLoadMore();
    }
  }, [hasMore, inView, isLoadingMore, onLoadMore]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">최근 내역</h3>
          <p className="mt-1 text-sm text-slate-400">최신 순서대로 차분하게 볼 수 있어요.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-base font-semibold text-slate-700">아직 내역이 없어요.</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            위에서 바로 추가하거나 CSV를 불러와 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <TransactionItem key={item.id} item={item} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}

      <div ref={ref} className="h-4" />

      {hasMore ? (
        <p className="text-center text-sm text-slate-400">
          {isLoadingMore ? "내역을 더 불러오고 있어요." : "아래로 내려서 더 볼 수 있어요."}
        </p>
      ) : null}
    </section>
  );
}
