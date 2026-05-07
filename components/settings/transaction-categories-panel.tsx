"use client";

import { useMemo, useState, useTransition } from "react";
import {
  archiveTransactionCategory,
  createTransactionCategory,
  reorderTransactionCategories,
  updateTransactionCategory,
  type TransactionCategoryViewModel,
} from "@/actions/finance";
import { Button } from "@/components/ui/button";

type TransactionCategoriesPanelProps = {
  initialCategories: TransactionCategoryViewModel[];
};

function moveCategory(
  items: TransactionCategoryViewModel[],
  id: string,
  direction: -1 | 1,
) {
  const index = items.findIndex((item) => item.id === id);

  if (index < 0) {
    return items;
  }

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [target] = nextItems.splice(index, 1);
  nextItems.splice(nextIndex, 0, target);

  return nextItems.map((item, orderIndex) => ({
    ...item,
    sortOrder: orderIndex,
  }));
}

export function TransactionCategoriesPanel({
  initialCategories,
}: TransactionCategoriesPanelProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newIncomeCategory, setNewIncomeCategory] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupedCategories = useMemo(
    () => ({
      EXPENSE: categories
        .filter((item) => item.type === "EXPENSE")
        .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
      INCOME: categories
        .filter((item) => item.type === "INCOME")
        .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
    }),
    [categories],
  );

  function getDraftValue(category: TransactionCategoryViewModel) {
    return drafts[category.id] ?? category.name;
  }

  function handleCreate(type: "INCOME" | "EXPENSE") {
    const nextName = type === "EXPENSE" ? newExpenseCategory : newIncomeCategory;

    startTransition(async () => {
      try {
        const refreshed = await createTransactionCategory({ name: nextName, type });
        setCategories(refreshed);
        setMessage("분류를 저장했어요.");
        if (type === "EXPENSE") setNewExpenseCategory("");
        else setNewIncomeCategory("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "분류를 저장하지 못했어요.");
      }
    });
  }

  function handleRename(category: TransactionCategoryViewModel) {
    const nextName = getDraftValue(category);

    startTransition(async () => {
      try {
        const refreshed = await updateTransactionCategory({
          id: category.id,
          name: nextName,
        });
        setCategories(refreshed);
        setMessage("분류 이름을 바꿨어요.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "분류 이름을 바꾸지 못했어요.");
      }
    });
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      try {
        const refreshed = await archiveTransactionCategory(id);
        setCategories(refreshed);
        setMessage("분류를 보관했어요.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "분류를 보관하지 못했어요.");
      }
    });
  }

  function handleReorder(type: "INCOME" | "EXPENSE", id: string, direction: -1 | 1) {
    const targetItems = type === "EXPENSE" ? groupedCategories.EXPENSE : groupedCategories.INCOME;
    const reordered = moveCategory(targetItems, id, direction);

    startTransition(async () => {
      try {
        const refreshed = await reorderTransactionCategories({
          orderedIds: reordered.map((item) => item.id),
          type,
        });
        setCategories(refreshed);
        setMessage("분류 순서를 저장했어요.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "분류 순서를 바꾸지 못했어요.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.8rem] border border-slate-200/70 bg-slate-50 px-5 py-5">
        <p className="text-sm leading-6 text-slate-500">
          거래 입력 폼과 분석 화면에서 같은 분류 체계를 쓰게 됩니다. 보관한 분류는 새 입력에서는 숨겨지지만 기존 기록과 합계에는 그대로 남아요.
        </p>
      </div>

      {(["EXPENSE", "INCOME"] as const).map((type) => {
        const items = groupedCategories[type];
        const title = type === "EXPENSE" ? "지출 분류" : "수입 분류";
        const newValue = type === "EXPENSE" ? newExpenseCategory : newIncomeCategory;

        return (
          <section key={type} className="space-y-4 rounded-[1.8rem] border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-400">입력 폼 드롭다운과 집계 기준에 반영돼요.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newValue}
                className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
                placeholder={type === "EXPENSE" ? "예: 교육비" : "예: 보너스"}
                onChange={(event) => {
                  if (type === "EXPENSE") setNewExpenseCategory(event.currentTarget.value);
                  else setNewIncomeCategory(event.currentTarget.value);
                }}
              />
              <Button type="button" disabled={isPending} onClick={() => handleCreate(type)}>
                추가하기
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((category, index) => (
                <div
                  key={category.id}
                  className="flex flex-col gap-3 rounded-[1.4rem] border border-slate-200/70 bg-slate-50 px-4 py-4 md:flex-row md:items-center"
                >
                  <div className="flex min-w-0 flex-1 gap-2">
                    <input
                      type="text"
                      value={getDraftValue(category)}
                      disabled={Boolean(category.archivedAt)}
                      className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 disabled:bg-slate-100 disabled:text-slate-400"
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [category.id]: event.currentTarget.value,
                        }))
                      }
                    />
                    {category.archivedAt ? (
                      <span className="self-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                        보관됨
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || index === 0}
                      onClick={() => handleReorder(type, category.id, -1)}
                    >
                      위로
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || index === items.length - 1}
                      onClick={() => handleReorder(type, category.id, 1)}
                    >
                      아래로
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || Boolean(category.archivedAt)}
                      onClick={() => handleRename(category)}
                    >
                      이름 저장
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isPending || Boolean(category.archivedAt)}
                      onClick={() => handleArchive(category.id)}
                    >
                      보관
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}
