"use client";

import { addMonths, format } from "date-fns";
import { useEffect, useMemo, useOptimistic, useState } from "react";
import {
  getFinanceSummary,
  getTransactionCategories,
  createTransaction,
  deleteTransaction,
  exportTransactions,
  getTransactions,
  importCSV,
  syncRecurringTransactions,
  updateTransaction,
  type FinanceSummary,
  type FinanceTransactionViewModel,
  type TransactionCategoryViewModel,
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
import type { ExpenseCategoryDatum } from "@/lib/planner";
import { formatKoreanMonthLabel } from "@/lib/timezone-date";
import { useRecurringSyncStore } from "@/store";
import { getAnalyticsData } from "@/actions/planner";

type FinanceClientShellProps = {
  currentMonth: string;
  initialCategories: TransactionCategoryViewModel[];
  initialExpenseByCategory: ExpenseCategoryDatum[];
  initialPage: TransactionPage;
  initialSummary: FinanceSummary;
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
  initialCategories,
  initialExpenseByCategory,
  initialPage,
  initialSummary,
}: FinanceClientShellProps) {
  const [basePage, setBasePage] = useState(initialPage);
  const [categories, setCategories] = useState(initialCategories);
  const [expenseByCategory, setExpenseByCategory] = useState(initialExpenseByCategory);
  const [editingItem, setEditingItem] = useState<FinanceTransactionViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryMessage, setSummaryMessage] = useState<string | null>(null);
  const [isCreatingOrUpdating, setIsCreatingOrUpdating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSyncingRecurring, setIsSyncingRecurring] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [summary, setSummary] = useState(initialSummary);
  const [optimisticPage, applyOptimistic] = useOptimistic(basePage, reducer);
  const isMonthSynced = useRecurringSyncStore((state) =>
    state.syncedMonths.has(selectedMonth),
  );
  const markMonthSynced = useRecurringSyncStore((state) => state.markMonthSynced);

  const hasItems = useMemo(() => optimisticPage.items.length > 0, [optimisticPage.items.length]);
  const canMoveForward = selectedMonth < currentMonth;

  useEffect(() => {
    if (isMonthSynced) {
      return;
    }

    let isActive = true;

    void (async () => {
      setIsSyncingRecurring(true);
      try {
        await syncRecurringTransactions(selectedMonth);
        markMonthSynced(selectedMonth);
        const [refreshedAnalytics, refreshedCategories, refreshedPage, refreshedSummary] = await Promise.all([
          getAnalyticsData(selectedMonth),
          getTransactionCategories(),
          getTransactions(),
          getFinanceSummary(selectedMonth),
        ]);
        if (!isActive) {
          return;
        }
        setExpenseByCategory(refreshedAnalytics.expenseByCategory);
        setCategories(refreshedCategories);
        setBasePage(refreshedPage);
        setSummary(refreshedSummary);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "반복 내역을 동기화하지 못했어요.");
        }
      } finally {
        if (isActive) {
          setIsSyncingRecurring(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isMonthSynced, markMonthSynced, selectedMonth]);

  async function refreshSummary(targetMonth = selectedMonth) {
    try {
      const [nextAnalytics, nextSummary] = await Promise.all([
        getAnalyticsData(targetMonth),
        getFinanceSummary(targetMonth),
      ]);
      setExpenseByCategory(nextAnalytics.expenseByCategory);
      setSummary(nextSummary);
      setSummaryMessage(null);
    } catch {
      setSummaryMessage("저장은 완료됐지만 요약 갱신이 지연되고 있어요.");
    }
  }

  async function changeMonth(offset: number) {
    const nextMonth = format(addMonths(new Date(`${selectedMonth}-01T00:00:00`), offset), "yyyy-MM");

    if (offset > 0 && nextMonth > currentMonth) {
      return;
    }

    setSelectedMonth(nextMonth);
    setSummaryMessage(null);
    setErrorMessage(null);

    try {
      if (!useRecurringSyncStore.getState().syncedMonths.has(nextMonth)) {
        setIsSyncingRecurring(true);
        await syncRecurringTransactions(nextMonth);
        markMonthSynced(nextMonth);
      }
      const [nextAnalytics, nextSummary] = await Promise.all([
        getAnalyticsData(nextMonth),
        getFinanceSummary(nextMonth),
      ]);
      setExpenseByCategory(nextAnalytics.expenseByCategory);
      setSummary(nextSummary);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "월별 요약을 불러오지 못했어요.");
    } finally {
      setIsSyncingRecurring(false);
    }
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
    setSummaryMessage(null);
    setIsCreatingOrUpdating(true);

    try {
      const created = await createTransaction(input);
      setBasePage((current) => reducer(current, { type: "prepend", item: created }));
      applyOptimistic({ type: "remove", id: tempId });
      await refreshSummary();
    } catch (error) {
      applyOptimistic({ type: "remove", id: tempId });
      setErrorMessage(error instanceof Error ? error.message : "내역을 저장하지 못했어요.");
    } finally {
      setIsCreatingOrUpdating(false);
    }
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
    setSummaryMessage(null);
    setIsCreatingOrUpdating(true);

    try {
      const updated = await updateTransaction({
        ...input,
        id: editingItem.id,
      });
      setBasePage((current) => reducer(current, { type: "replace", item: updated }));
      setEditingItem(null);
      await refreshSummary();
    } catch (error) {
      applyOptimistic({ type: "replace", item: previousItem });
      setErrorMessage(error instanceof Error ? error.message : "내역을 수정하지 못했어요.");
    } finally {
      setIsCreatingOrUpdating(false);
    }
  }

  async function handleLoadMore() {
    if (!basePage.nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const nextPage = await getTransactions({ cursor: basePage.nextCursor });
      setBasePage((current) => reducer(current, { type: "append", ...nextPage }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "내역을 더 불러오지 못했어요.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleDelete(id: string) {
    const deletedItem = basePage.items.find((item) => item.id === id);
    if (!deletedItem) return;

    setBasePage((current) => reducer(current, { type: "remove", id }));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }

    try {
      await deleteTransaction(id);
      await refreshSummary();
    } catch (error) {
      setBasePage((current) => reducer(current, { type: "prepend", item: deletedItem }));
      setErrorMessage(error instanceof Error ? error.message : "내역을 삭제하지 못했어요.");
    }
  }

  async function handleImport(rows: CsvTransactionRow[]) {
    setErrorMessage(null);
    setSummaryMessage(null);
    setIsImporting(true);

    try {
      await importCSV(rows);
      const [refreshedAnalytics, refreshedCategories, refreshed, nextSummary] = await Promise.all([
        getAnalyticsData(selectedMonth),
        getTransactionCategories(),
        getTransactions(),
        getFinanceSummary(selectedMonth),
      ]);
      setExpenseByCategory(refreshedAnalytics.expenseByCategory);
      setCategories(refreshedCategories);
      setBasePage(refreshed);
      setSummary(nextSummary);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "CSV를 불러오지 못했어요.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleExport() {
    return exportTransactions();
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section>
        <Card className="bg-[linear-gradient(180deg,#ffffff,#f8fbff)]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{formatKoreanMonthLabel(selectedMonth)}</CardTitle>
                <CardDescription>선택한 달의 수입과 지출 흐름을 확인해 보세요.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => void changeMonth(-1)}>
                  이전 달
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canMoveForward}
                  onClick={() => void changeMonth(1)}
                >
                  다음 달
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.6rem] bg-slate-50 px-5 py-5">
                <p className="text-sm text-slate-400">총 지출</p>
                <p className="mt-2 text-[1.9rem] font-semibold tracking-tight text-slate-900">
                  {summary.totalExpense.toLocaleString("ko-KR")}원
                </p>
              </div>
              <div className="rounded-[1.6rem] bg-slate-50 px-5 py-5">
                <p className="text-sm text-slate-400">총 수입</p>
                <p className="mt-2 text-[1.9rem] font-semibold tracking-tight text-slate-900">
                  {summary.totalIncome.toLocaleString("ko-KR")}원
                </p>
              </div>
              <div className="rounded-[1.6rem] bg-slate-50 px-5 py-5">
                <p className="text-sm text-slate-400">총 합계</p>
                <p className="mt-2 text-[1.9rem] font-semibold tracking-tight text-slate-900">
                  {summary.netAmount.toLocaleString("ko-KR")}원
                </p>
              </div>
            </div>
            {summaryMessage ? <p className="text-sm text-slate-500">{summaryMessage}</p> : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>분류별 지출</CardTitle>
          <CardDescription>이번 달에 어디에 얼마나 썼는지 바로 볼 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent>
          {expenseByCategory.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-400">
              선택한 달에는 아직 지출이 없어요.
            </div>
          ) : (
            <div className="space-y-3">
              {expenseByCategory
                .slice()
                .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
                .map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-[1.4rem] border border-slate-200/70 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-sm font-medium text-slate-700">{item.name}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.value.toLocaleString("ko-KR")}원
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              categoryOptions={categories}
              initialValues={toInputValues(editingItem)}
              isEditing
              isPending={isCreatingOrUpdating}
              onCancel={() => setEditingItem(null)}
              onSubmit={handleUpdate}
            />
          ) : (
            <QuickAddForm
              categoryOptions={categories}
              isPending={isCreatingOrUpdating}
              onSubmit={handleCreate}
            />
          )}
        </CardContent>
      </Card>

      <Card size="sm" className="bg-slate-50/75">
        <CardHeader>
          <CardTitle>CSV 관리</CardTitle>
          <CardDescription>가져오기와 내보내기는 필요할 때만 조용하게 쓸 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <CsvUploader disabled={isImporting} onImport={handleImport} />
          <CsvExportButton disabled={!hasItems || isImporting} onExport={handleExport} />
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
      {isSyncingRecurring ? (
        <div className="rounded-[1.6rem] border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          반복 내역을 동기화하고 있어요.
        </div>
      ) : null}

      <TransactionList
        hasMore={Boolean(basePage.nextCursor)}
        isLoadingMore={isLoadingMore}
        items={optimisticPage.items}
        onDelete={handleDelete}
        onEdit={setEditingItem}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
}
