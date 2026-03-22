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
  isPending: boolean;
  onSubmit: (input: QuickAddTransactionInput) => Promise<void> | void;
};

export function QuickAddForm({ isPending, onSubmit }: QuickAddFormProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const form = useForm<QuickAddTransactionInput>({
    defaultValues: {
      amount: 0,
      category: "",
      date: formatDateInputValue(new Date()),
      isRecurring: false,
      note: "",
      recurrenceDate: undefined,
      type: "EXPENSE",
    },
    resolver: zodResolver(quickAddTransactionFormSchema),
  });

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
    form.reset({
      amount: 0,
      category: "",
      date: formatDateInputValue(new Date()),
      isRecurring: false,
      note: "",
      recurrenceDate: undefined,
      type: values.type,
    });
    setIsDrawerOpen(false);
  }

  const validationMessage = Object.values(form.formState.errors)[0]?.message as
    | string
    | undefined;

  const formFields = (
    <>
      <label className="flex flex-col gap-2 text-sm">
        <span>날짜</span>
        <input
          type="date"
          {...form.register("date")}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>구분</span>
        <select
          {...form.register("type")}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-primary"
        >
          <option value="EXPENSE">지출</option>
          <option value="INCOME">수입</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>분류</span>
        <input
          type="text"
          {...form.register("category")}
          placeholder="예: 식비, 월급"
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>금액</span>
        <input
          type="number"
          min={0}
          step={1}
          {...form.register("amount", { valueAsNumber: true })}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm md:col-span-2">
        <span>메모</span>
        <input
          type="text"
          {...form.register("note")}
          placeholder="기억해 둘 내용이 있다면 적어 주세요"
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-primary"
        />
      </label>

      <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
        <input
          type="checkbox"
          {...form.register("isRecurring")}
          className="size-5 rounded border-slate-300"
        />
        <span>매달 반복해요</span>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>반복일</span>
        <input
          type="number"
          min={1}
          max={31}
          disabled={!isRecurring}
          {...form.register("recurrenceDate", { valueAsNumber: true })}
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </label>

      <div className="flex flex-col gap-3 md:col-span-4 md:flex-row md:items-end">
        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? "저장하고 있어요" : "내역 추가하기"}
        </Button>
        {validationMessage ? (
          <p className="text-sm text-destructive">{validationMessage}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      <div className="md:hidden">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button type="button" size="lg" className="w-full justify-between rounded-3xl">
              <span>내역 추가하기</span>
              <span className="text-xs text-primary-foreground/80">빠르게 입력해요</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-[2rem] bg-slate-50">
            <DrawerHeader>
              <DrawerTitle>내역 추가하기</DrawerTitle>
              <DrawerDescription>
                지금 보고 있는 흐름을 잊기 전에 바로 기록해요.
              </DrawerDescription>
            </DrawerHeader>
            <form
              className="safe-pb grid gap-4 overflow-y-auto px-4 pb-6 pt-2 sm:px-6"
              onSubmit={form.handleSubmit(submitValues)}
            >
              {formFields}
            </form>
          </DrawerContent>
        </Drawer>
      </div>

      <form
        className="hidden gap-4 rounded-3xl bg-slate-50 p-6 md:grid md:grid-cols-6"
        onSubmit={form.handleSubmit(submitValues)}
      >
        {formFields}
      </form>
    </>
  );
}
