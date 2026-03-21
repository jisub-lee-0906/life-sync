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
  onLoadMore: () => Promise<void> | void;
};

export function TransactionList({
  hasMore,
  isLoadingMore,
  items,
  onDelete,
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
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          No transactions yet. Add your first record above or import a CSV.
        </p>
      ) : (
        items.map((item) => (
          <TransactionItem key={item.id} item={item} onDelete={onDelete} />
        ))
      )}

      <div ref={ref} className="h-4" />

      {hasMore ? (
        <p className="text-center text-sm text-muted-foreground">
          {isLoadingMore ? "Loading more..." : "Scroll to load more"}
        </p>
      ) : null}
    </div>
  );
}
