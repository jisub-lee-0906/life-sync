"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import {
  createTransaction,
  deleteTransaction,
  exportTransactions,
  getCurrentMonthExpenseTotal,
  getTransactions,
  importCSV,
  syncRecurringTransactions,
  updateTransaction,
  type FinanceTransactionViewModel,
  type TransactionCursor,
  type TransactionPage,
} from "@/actions/finance";
import { CsvExportButton } from "@/components/finance/csv-export-button";
import { CsvUploader } from "@/components/finance/csv-uploader";
import { QuickAddForm } from "@/components/finance/quick-add-form";
import { TransactionList } from "@/components/finance/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CsvTransactionRow, QuickAddTransactionInput } from "@/lib/finance";
import { useRecurringSyncStore } from "@/store";

type FinanceClientShellProps = {
  currentMonth: string;
  initialMonthExpenseTotal: number;
  initialPage: TransactionPage;
};

type OptimisticAction =
  | { type: "append"; items: FinanceTransactionViewModel[]; nextCursor: TransactionCursor }
  | { type: "prepend"; item: FinanceTransactionViewModel }
  | { type: "remove"; id: string }
  | { type: "replace"; item: FinanceTransactionViewModel };

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
        items: [action.item, ...state.items].sort(compareTransactions),
      };
    case "remove":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
      };
    case "replace":
      return {
        ...state,
        items: state.items
          .map((item) => (item.id === action.item.id ? action.item : item))
          .sort(compareTransactions),
      };
    default:
      return state;
  }
}

function toInputValues(item: FinanceTransactionViewModel): QuickAddTransactionInput {
  return {
    amount: item.amount,
    category: item.category,
    date: item.date,
    isRecurring: item.isRecurring,
    note: item.note ?? "",
    recurrenceDate: item.recurrenceDate ?? undefined,
    type: item.type,
  };
}

export function FinanceClientShell({
  currentMonth,
  initialMonthExpenseTotal,
  initialPage,
}: FinanceClientShellProps) {
  const [basePage, setBasePage] = useState(initialPage);
  const [editingItem, setEditingItem] = useState<FinanceTransactionViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [monthExpenseTotal, setMonthExpenseTotal] = useState(initialMonthExpenseTotal);
  const [optimisticPage, applyOptimistic] = useOptimistic(basePage, reducer);
  const isMonthSynced = useRecurringSyncStore((state) =>
    state.syncedMonths.has(currentMonth),
  );
  const markMonthSynced = useRecurringSyncStore((state) => state.markMonthSynced);

  const hasItems = useMemo(() => optimisticPage.items.length > 0, [optimisticPage.items.length]);

  useEffect(() => {
    if (isMonthSynced) {
      return;
    }

    startTransition(async () => {
      try {
        await syncRecurringTransactions(currentMonth);
        markMonthSynced(currentMonth);
        const [refreshedPage, refreshedMonthExpenseTotal] = await Promise.all([
          getTransactions(),
          getCurrentMonthExpenseTotal(currentMonth),
        ]);
        setBasePage(refreshedPage);
        setMonthExpenseTotal(refreshedMonthExpenseTotal);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "반복 내역을 동기화하지 못했어요.");
      }
    });
  }, [currentMonth, isMonthSynced, markMonthSynced]);

  async function refreshMonthTotal() {
    const nextTotal = await getCurrentMonthExpenseTotal(currentMonth);
    setMonthExpenseTotal(nextTotal);
  }

  async function handleCreate(input: QuickAddTransactionInput) {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticItem: FinanceTransactionViewModel = {
      amount: Number(input.amount),
      category: input.category,
      date: input.date,
      derivedYearMonth: null,
      id: tempId,
      isOptimistic: true,
      isRecurring: Boolean(input.isRecurring),
      note: input.note?.trim() || null,
      recurrenceDate:
        input.isRecurring && input.recurrenceDate != null
          ? Number(input.recurrenceDate)
          : null,
      sourceTransactionId: null,
      type: input.type,
    };

    applyOptimistic({ type: "prepend", item: optimisticItem });
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const created = await createTransaction(input);
        setBasePage((current) => reducer(current, { type: "prepend", item: created }));
        applyOptimistic({ type: "remove", id: tempId });
        await refreshMonthTotal();
      } catch (error) {
        applyOptimistic({ type: "remove", id: tempId });
        setErrorMessage(error instanceof Error ? error.message : "내역을 저장하지 못했어요.");
      }
    });
  }

  async function handleUpdate(input: QuickAddTransactionInput) {
    if (!editingItem) {
      return;
    }

    const previousItem = editingItem;
    const optimisticItem: FinanceTransactionViewModel = {
      ...editingItem,
      amount: Number(input.amount),
      category: input.category,
      date: input.date,
      isRecurring: input.isRecurring,
      note: input.note?.trim() || null,
      recurrenceDate: input.isRecurring ? input.recurrenceDate ?? null : null,
      type: input.type,
    };

    applyOptimistic({ type: "replace", item: optimisticItem });
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const updated = await updateTransaction({
          ...input,
          id: editingItem.id,
        });
        setBasePage((current) => reducer(current, { type: "replace", item: updated }));
        setEditingItem(null);
        await refreshMonthTotal();
      } catch (error) {
        applyOptimistic({ type: "replace", item: previousItem });
        setErrorMessage(error instanceof Error ? error.message : "내역을 수정하지 못했어요.");
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
        setErrorMessage(error instanceof Error ? error.message : "내역을 더 불러오지 못했어요.");
      }
    });
  }

  async function handleDelete(id: string) {
    const deletedItem = basePage.items.find((item) => item.id === id);
    if (!deletedItem) return;

    setBasePage((current) => reducer(current, { type: "remove", id }));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }

    startTransition(async () => {
      try {
        await deleteTransaction(id);
        await refreshMonthTotal();
      } catch (error) {
        setBasePage((current) => reducer(current, { type: "prepend", item: deletedItem }));
        setErrorMessage(error instanceof Error ? error.message : "내역을 삭제하지 못했어요.");
      }
    });
  }

  async function handleImport(rows: CsvTransactionRow[]) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await importCSV(rows);
        const [refreshed, nextTotal] = await Promise.all([
          getTransactions(),
          getCurrentMonthExpenseTotal(currentMonth),
        ]);
        setBasePage(refreshed);
        setMonthExpenseTotal(nextTotal);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "CSV를 불러오지 못했어요.");
      }
    });
  }

  async function handleExport() {
    return exportTransactions();
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section>
        <Card className="bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
          <CardHeader>
            <CardTitle>이번 달 지출</CardTitle>
            <CardDescription>지금까지 쓴 금액을 가볍게 확인해 보세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">총 지출</p>
                <p className="mt-2 text-[2.2rem] font-semibold tracking-tight text-slate-900 sm:text-[2.6rem]">
                  {monthExpenseTotal.toLocaleString("ko-KR")}원
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 px-4 py-3 text-sm text-slate-500">
                이번 달 흐름을 더 가볍게 정리해 보세요.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "내역 수정" : "빠른 입력"}</CardTitle>
          <CardDescription>
            {editingItem
              ? "바꿀 내용만 정리하고 바로 저장할 수 있어요."
              : "자주 쓰는 항목부터 빠르게 기록할 수 있어요."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editingItem ? (
            <QuickAddForm
              initialValues={toInputValues(editingItem)}
              isEditing
              isPending={isPending}
              onCancel={() => setEditingItem(null)}
              onSubmit={handleUpdate}
            />
          ) : (
            <QuickAddForm isPending={isPending} onSubmit={handleCreate} />
          )}
        </CardContent>
      </Card>

      <Card size="sm" className="bg-slate-50/75">
        <CardHeader>
          <CardTitle>CSV 관리</CardTitle>
          <CardDescription>가져오기와 내보내기는 필요할 때만 조용하게 쓸 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CsvUploader disabled={isPending} onImport={handleImport} />
          <CsvExportButton disabled={!hasItems || isPending} onExport={handleExport} />
          {editingItem ? (
            <Button variant="ghost" onClick={() => setEditingItem(null)}>
              수정 닫기
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {errorMessage ? (
        <div className="rounded-[1.6rem] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <TransactionList
        hasMore={Boolean(basePage.nextCursor)}
        isLoadingMore={isPending}
        items={optimisticPage.items}
        onDelete={handleDelete}
        onEdit={setEditingItem}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
