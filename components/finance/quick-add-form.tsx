"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  formatDateInputValue,
  quickAddTransactionFormSchema,
  type QuickAddTransactionInput,
} from "@/lib/finance";

type QuickAddFormProps = {
  initialValues?: QuickAddTransactionInput;
  isEditing?: boolean;
  isPending: boolean;
  onCancel?: () => void;
  onSubmit: (input: QuickAddTransactionInput) => Promise<void> | void;
};

function buildDefaults(input?: QuickAddTransactionInput): QuickAddTransactionInput {
  return {
    amount: input?.amount ?? 0,
    category: input?.category ?? "",
    date: input?.date ?? formatDateInputValue(new Date()),
    isRecurring: input?.isRecurring ?? false,
    note: input?.note ?? "",
    recurrenceDate: input?.recurrenceDate ?? undefined,
    type: input?.type ?? "EXPENSE",
  };
}

export function QuickAddForm({
  initialValues,
  isEditing = false,
  isPending,
  onCancel,
  onSubmit,
}: QuickAddFormProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const form = useForm<QuickAddTransactionInput>({
    defaultValues: buildDefaults(initialValues),
    resolver: zodResolver(quickAddTransactionFormSchema),
  });

  useEffect(() => {
    form.reset(buildDefaults(initialValues));
  }, [form, initialValues]);

  const isRecurring = useWatch({
    control: form.control,
    name: "isRecurring",
  });

  useEffect(() => {
    if (!isRecurring) {
      form.setValue("recurrenceDate", undefined);
    }
  }, [form, isRecurring]);

  async function submitValues(values: QuickAddTransactionInput) {
    await onSubmit(values);

    if (!isEditing) {
      form.reset(buildDefaults());
      setIsDrawerOpen(false);
    }
  }

  const validationMessage = Object.values(form.formState.errors)[0]?.message as
    | string
    | undefined;
  const primaryLabel = isEditing ? "내역 저장하기" : "내역 추가하기";
  const helperText = isEditing
    ? "바꿀 항목만 차분하게 정리해 주세요."
    : "오늘 쓴 금액을 바로 적어둘 수 있어요.";

  const formFields = (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-500">구분</span>
          <select
            {...form.register("type")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
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
            {...form.register("amount", { valueAsNumber: true })}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-slate-500">분류</span>
          <input
            type="text"
            {...form.register("category")}
            placeholder="예: 식비, 월급"
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
          />
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
          <input
            type="text"
            {...form.register("note")}
            placeholder="필요한 기록만 짧게 남겨도 충분해요."
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "저장하고 있어요" : primaryLabel}
          </Button>
        </div>
      </div>
    </>
  );

  if (isEditing) {
    return (
      <form
        className="space-y-4 rounded-[1.8rem] border border-slate-200/70 bg-slate-50/85 p-5"
        onSubmit={form.handleSubmit(submitValues)}
      >
        {formFields}
      </form>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button type="button" size="lg" className="w-full justify-between rounded-[1.6rem]">
              <span>{primaryLabel}</span>
              <span className="text-xs text-primary-foreground/75">빠르게 기록해요</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-[2rem] bg-slate-50">
            <DrawerHeader>
              <DrawerTitle>{primaryLabel}</DrawerTitle>
              <DrawerDescription>{helperText}</DrawerDescription>
            </DrawerHeader>
            <form
              className="safe-pb space-y-4 overflow-y-auto px-4 pb-6 pt-2 sm:px-6"
              onSubmit={form.handleSubmit(submitValues)}
            >
              {formFields}
            </form>
          </DrawerContent>
        </Drawer>
      </div>

      <form
        className="hidden space-y-4 rounded-[1.8rem] border border-slate-200/70 bg-slate-50/85 p-5 md:block"
        onSubmit={form.handleSubmit(submitValues)}
      >
        {formFields}
      </form>
    </>
  );
}
