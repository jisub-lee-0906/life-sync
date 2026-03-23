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
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-sm leading-6 text-muted-foreground shadow-sm">
          아직 내역이 없어요. 위에서 바로 추가하거나 CSV를 불러와 보세요.
        </p>
      ) : (
        items.map((item) => (
          <TransactionItem key={item.id} item={item} onDelete={onDelete} onEdit={onEdit} />
        ))
      )}

      <div ref={ref} className="h-4" />

      {hasMore ? (
        <p className="text-center text-sm text-muted-foreground">
          {isLoadingMore ? "내역을 더 불러오는 중이에요." : "아래로 내려서 더 볼 수 있어요."}
        </p>
      ) : null}
    </div>
  );
}
