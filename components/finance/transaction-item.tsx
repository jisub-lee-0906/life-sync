"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FinanceTransactionViewModel } from "@/actions/finance";

type TransactionItemProps = {
  item: FinanceTransactionViewModel;
  onDelete: (id: string) => Promise<void> | void;
};

export function TransactionItem({ item, onDelete }: TransactionItemProps) {
  const date = new Date(`${item.date}T00:00:00`);

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${
        item.isOptimistic ? "opacity-70" : ""
      }`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.type === "EXPENSE" ? "outline" : "secondary"}>
            {item.type}
          </Badge>
          {item.isRecurring ? <Badge variant="outline">Recurring</Badge> : null}
          {item.isOptimistic ? <Badge variant="outline">Pending</Badge> : null}
        </div>
        <p className="font-medium">{item.category}</p>
        <p className="text-sm text-muted-foreground">
          {format(date, "PPP")}
          {item.note ? ` • ${item.note}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-lg font-semibold">
          {item.amount.toLocaleString("ko-KR")}원
        </p>
        {!item.isOptimistic ? (
          <Button type="button" variant="ghost" onClick={() => onDelete(item.id)}>
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
