"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  createTransaction,
  deleteTransaction,
  exportTransactions,
  getTransactions,
  importCSV,
  type FinanceTransactionViewModel,
  type TransactionCursor,
  type TransactionPage,
} from "@/actions/finance";
import { CsvExportButton } from "@/components/finance/csv-export-button";
import { CsvUploader } from "@/components/finance/csv-uploader";
import { QuickAddForm } from "@/components/finance/quick-add-form";
import { TransactionList } from "@/components/finance/transaction-list";
import type { CsvTransactionRow, QuickAddTransactionInput } from "@/lib/finance";

type FinanceClientShellProps = {
  initialPage: TransactionPage;
};

type OptimisticAction =
  | { type: "append"; items: FinanceTransactionViewModel[]; nextCursor: TransactionCursor }
  | { type: "prepend"; item: FinanceTransactionViewModel }
  | { type: "restore"; item: FinanceTransactionViewModel }
  | { type: "remove"; id: string }
;

function compareTransactions(
  left: FinanceTransactionViewModel,
  right: FinanceTransactionViewModel,
) {
  const dateComparison = right.date.localeCompare(left.date);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return right.id.localeCompare(left.id);
}

function reducer(state: TransactionPage, action: OptimisticAction): TransactionPage {
  switch (action.type) {
    case "append":
      return {
        items: [...state.items, ...action.items],
        nextCursor: action.nextCursor,
      };
    case "prepend":
      return {
        ...state,
        items: [action.item, ...state.items],
      };
    case "restore":
      return {
        ...state,
        items: [...state.items, action.item].sort(compareTransactions),
      };
    case "remove":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };
    default:
      return state;
  }
}

export function FinanceClientShell({ initialPage }: FinanceClientShellProps) {
  const [basePage, setBasePage] = useState(initialPage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticPage, applyOptimistic] = useOptimistic(basePage, reducer);

  const hasItems = useMemo(() => optimisticPage.items.length > 0, [optimisticPage.items.length]);

  async function handleCreate(input: QuickAddTransactionInput) {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticItem: FinanceTransactionViewModel = {
      amount: Number(input.amount),
      category: input.category,
      date: input.date,
      id: tempId,
      isOptimistic: true,
      isRecurring: Boolean(input.isRecurring),
      note: input.note?.trim() || null,
      recurrenceDate:
        input.isRecurring && input.recurrenceDate != null
          ? Number(input.recurrenceDate)
          : null,
      type: input.type,
    };

    applyOptimistic({ type: "prepend", item: optimisticItem });
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const created = await createTransaction(input);
        setBasePage((current) => reducer(current, { type: "prepend", item: created }));
        applyOptimistic({ type: "remove", id: tempId });
      } catch (error) {
        applyOptimistic({ type: "remove", id: tempId });
        setErrorMessage(error instanceof Error ? error.message : "Failed to create transaction.");
      }
    });
  }

  async function handleLoadMore() {
    if (!basePage.nextCursor || isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const nextPage = await getTransactions({ cursor: basePage.nextCursor });
        setBasePage((current) => reducer(current, { type: "append", ...nextPage }));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load more transactions.");
      }
    });
  }

  async function handleDelete(id: string) {
    const deletedItem = basePage.items.find((item) => item.id === id);
    setBasePage((current) => reducer(current, { type: "remove", id }));

    startTransition(async () => {
      try {
        await deleteTransaction(id);
      } catch (error) {
        if (deletedItem) {
          setBasePage((current) => reducer(current, { type: "restore", item: deletedItem }));
        }
        setErrorMessage(error instanceof Error ? error.message : "Failed to delete transaction.");
      }
    });
  }

  async function handleImport(rows: CsvTransactionRow[]) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await importCSV(rows);
        const refreshed = await getTransactions();
        setBasePage(refreshed);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to import CSV.");
      }
    });
  }

  async function handleExport() {
    const rows = await exportTransactions();
    return rows;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <QuickAddForm isPending={isPending} onSubmit={handleCreate} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <CsvUploader disabled={isPending} onImport={handleImport} />
        <CsvExportButton disabled={!hasItems || isPending} onExport={handleExport} />
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <TransactionList
        hasMore={Boolean(basePage.nextCursor)}
        isLoadingMore={isPending}
        items={optimisticPage.items}
        onDelete={handleDelete}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
