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

  const validationMessage = Object.values(form.formState.errors)[0]?.message as string | undefined;

  const formFields = (
    <>
      <label className="flex flex-col gap-2 text-sm">
        <span>Date</span>
        <input
          type="date"
          {...form.register("date")}
          className="min-h-11 rounded-xl border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>Type</span>
        <select
          {...form.register("type")}
          className="min-h-11 rounded-xl border px-3 py-2"
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>Category</span>
        <input
          type="text"
          {...form.register("category")}
          placeholder="Category"
          className="min-h-11 rounded-xl border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>Amount</span>
        <input
          type="number"
          min={0}
          step={1}
          {...form.register("amount", { valueAsNumber: true })}
          className="min-h-11 rounded-xl border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm md:col-span-2">
        <span>Note</span>
        <input
          type="text"
          {...form.register("note")}
          placeholder="Optional note"
          className="min-h-11 rounded-xl border px-3 py-2"
        />
      </label>

      <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm">
        <input
          type="checkbox"
          {...form.register("isRecurring")}
          className="size-5 rounded border"
        />
        <span>Recurring</span>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>Repeat day</span>
        <input
          type="number"
          min={1}
          max={31}
          disabled={!isRecurring}
          {...form.register("recurrenceDate", { valueAsNumber: true })}
          className="min-h-11 rounded-xl border px-3 py-2 disabled:opacity-50"
        />
      </label>

      <div className="flex flex-col gap-3 md:col-span-4 md:flex-row md:items-end">
        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? "Saving..." : "Quick Add"}
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
            <Button type="button" size="lg" className="w-full justify-between rounded-2xl">
              <span>Quick Add</span>
              <span className="text-xs text-primary-foreground/80">Open entry sheet</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-[2rem]">
            <DrawerHeader>
              <DrawerTitle>Quick Add</DrawerTitle>
              <DrawerDescription>
                Add a transaction without leaving the current list position.
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
        className="hidden gap-4 rounded-3xl border p-4 md:grid md:grid-cols-6 md:p-5"
        onSubmit={form.handleSubmit(submitValues)}
      >
        {formFields}
      </form>
    </>
  );
}
