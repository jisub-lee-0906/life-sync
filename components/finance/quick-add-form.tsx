"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { TransactionCategoryViewModel } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import {
  formatDateInputValue,
  normalizeTransactionText,
  quickAddTransactionFormSchema,
  type QuickAddTransactionFormValues,
  type QuickAddTransactionInput,
} from "@/lib/finance";

type QuickAddFormProps = {
  categoryOptions: TransactionCategoryViewModel[];
  initialValues?: QuickAddTransactionInput;
  isEditing?: boolean;
  isPending: boolean;
  onCancel?: () => void;
  onSubmit: (input: QuickAddTransactionInput) => Promise<void> | void;
};

function getAvailableCategories(
  categories: TransactionCategoryViewModel[],
  type: "INCOME" | "EXPENSE",
) {
  return categories.filter((item) => item.type === type && !item.archivedAt);
}

function resolveCategoryValue(
  categories: TransactionCategoryViewModel[],
  type: "INCOME" | "EXPENSE",
  preferred?: string,
) {
  const normalizedPreferred = preferred ? normalizeTransactionText(preferred) : "";
  const available = getAvailableCategories(categories, type);
  const matchedPreferred = available.find((item) => item.name === normalizedPreferred);

  if (matchedPreferred) {
    return matchedPreferred.name;
  }

  return available[0]?.name ?? normalizedPreferred;
}

function buildDefaults(
  input: QuickAddTransactionInput | undefined,
  categories: TransactionCategoryViewModel[],
): QuickAddTransactionInput {
  const type = input?.type ?? "EXPENSE";

  return {
    amount: input?.amount ?? 0,
    category: resolveCategoryValue(categories, type, input?.category),
    date: input?.date ?? formatDateInputValue(new Date()),
    isRecurring: input?.isRecurring ?? false,
    note: input?.note ?? "",
    recurrenceDate: input?.recurrenceDate ?? undefined,
    type,
  };
}

function blurActiveInput() {
  const activeElement = document.activeElement;

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement
  ) {
    activeElement.blur();
  }
}

export function QuickAddForm({
  categoryOptions,
  initialValues,
  isEditing = false,
  isPending,
  onCancel,
  onSubmit,
}: QuickAddFormProps) {
  const [isOpen, setIsOpen] = useState(isEditing);
  const [isNoteComposing, setIsNoteComposing] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const form = useForm<QuickAddTransactionFormValues, unknown, QuickAddTransactionInput>({
    defaultValues: buildDefaults(initialValues, categoryOptions),
    resolver: zodResolver(quickAddTransactionFormSchema),
  });

  useEffect(() => {
    form.reset(buildDefaults(initialValues, categoryOptions));
  }, [categoryOptions, form, initialValues]);

  const type = useWatch({
    control: form.control,
    name: "type",
  });
  const isRecurring = useWatch({
    control: form.control,
    name: "isRecurring",
  });

  const availableCategories = useMemo(
    () => getAvailableCategories(categoryOptions, type ?? "EXPENSE"),
    [categoryOptions, type],
  );
  const effectiveCategories = useMemo(() => {
    const currentCategory = normalizeTransactionText(form.getValues("category") ?? "");

    if (currentCategory.length === 0 || availableCategories.some((item) => item.name === currentCategory)) {
      return availableCategories;
    }

    return [
      ...availableCategories,
      {
        archivedAt: new Date().toISOString(),
        id: `archived-${currentCategory}`,
        name: currentCategory,
        sortOrder: Number.MAX_SAFE_INTEGER,
        type: type ?? "EXPENSE",
      },
    ];
  }, [availableCategories, form, type]);

  useEffect(() => {
    if (!isRecurring) {
      form.setValue("recurrenceDate", undefined);
    }
  }, [form, isRecurring]);

  useEffect(() => {
    const currentCategory = normalizeTransactionText(form.getValues("category") ?? "");
    if (effectiveCategories.length === 0) {
      return;
    }

    if (!effectiveCategories.some((item) => item.name === currentCategory)) {
      form.setValue("category", effectiveCategories[0]?.name ?? "", {
        shouldDirty: !isEditing,
        shouldValidate: true,
      });
    }
  }, [effectiveCategories, form, isEditing]);

  const isFormOpen = isEditing || isOpen;

  useEffect(() => {
    if (!isFormOpen || isEditing) {
      return;
    }

    const timeout = window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      amountInputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [isEditing, isFormOpen]);

  async function submitValues(values: QuickAddTransactionInput) {
    await onSubmit(values);

    if (!isEditing) {
      form.reset(buildDefaults(undefined, categoryOptions));
      setIsOpen(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isNoteComposing) {
      return;
    }

    blurActiveInput();
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    await form.handleSubmit(submitValues)();
  }

  const validationMessage = Object.values(form.formState.errors)[0]?.message as
    | string
    | undefined;
  const amountField = form.register("amount", { valueAsNumber: true });
  const primaryLabel = isEditing ? "내역 저장하기" : "내역 추가하기";
  const helperText = effectiveCategories.length === 0
    ? "설정에서 분류를 먼저 추가해 주세요."
    : isEditing
      ? "바꿀 항목만 차분하게 정리해 주세요."
      : "오늘 쓴 금액을 바로 적어둘 수 있어요.";

  if (!isFormOpen) {
    return (
      <Button type="button" size="lg" className="w-full justify-between rounded-[1.6rem]" onClick={() => setIsOpen(true)}>
        <span>{primaryLabel}</span>
        <span className="text-xs text-primary-foreground/75">빠르게 기록해요</span>
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      className="space-y-4 rounded-[1.8rem] border border-slate-200/70 bg-slate-50/85 p-5"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-500">구분</span>
          <select
            {...form.register("type")}
            className="select-field min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
          >
            <option value="EXPENSE">지출</option>
            <option value="INCOME">수입</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-500">금액</span>
          <input
            type="number"
            min={0}
            step={1}
            {...amountField}
            ref={(element) => {
              amountField.ref(element);
              amountInputRef.current = element;
            }}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-500">분류</span>
          <select
            {...form.register("category")}
            className="select-field min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
          >
            {effectiveCategories.length === 0 ? (
              <option value="">분류 없음</option>
            ) : (
              effectiveCategories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.archivedAt ? `${item.name} (보관됨)` : item.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-500">날짜</span>
          <input
            type="date"
            {...form.register("date")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-500">메모</span>
          <Controller
            control={form.control}
            name="note"
            render={({ field }) => (
              <input
                type="text"
                value={field.value}
                placeholder="필요한 기록만 짧게 남겨도 충분해요."
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
                onBlur={(event) => {
                  field.onChange(normalizeTransactionText(event.currentTarget.value));
                  field.onBlur();
                }}
                onChange={(event) => field.onChange(event.currentTarget.value)}
                onCompositionEnd={(event) => {
                  setIsNoteComposing(false);
                  field.onChange(normalizeTransactionText(event.currentTarget.value));
                }}
                onCompositionStart={() => setIsNoteComposing(true)}
              />
            )}
          />
        </label>

        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              {...form.register("isRecurring")}
              className="size-5 rounded border-slate-300"
            />
            <span className="font-medium text-slate-700">매달 반복해요</span>
          </label>
          <div className="mt-3">
            <input
              type="number"
              min={1}
              max={31}
              disabled={!isRecurring}
              {...form.register("recurrenceDate", { valueAsNumber: true })}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="반복일"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          {validationMessage ? (
            <p className="text-sm text-destructive">{validationMessage}</p>
          ) : (
            <p className="text-sm text-slate-400">{helperText}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing && onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          ) : null}
          {!isEditing ? (
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              입력 닫기
            </Button>
          ) : null}
          <Button type="submit" disabled={isPending || isNoteComposing || effectiveCategories.length === 0}>
            {isPending ? "저장하고 있어요" : primaryLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
