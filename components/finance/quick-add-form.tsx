"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  quickAddTransactionFormSchema,
  type QuickAddTransactionInput,
} from "@/lib/finance";

type QuickAddFormProps = {
  isPending: boolean;
  onSubmit: (input: QuickAddTransactionInput) => Promise<void> | void;
};

export function QuickAddForm({ isPending, onSubmit }: QuickAddFormProps) {
  const form = useForm<QuickAddTransactionInput>({
    defaultValues: {
      amount: 0,
      category: "",
      date: new Date().toLocaleDateString("en-CA"),
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

  return (
    <form
      className="grid gap-3 rounded-2xl border p-4 md:grid-cols-6"
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
        form.reset({
          amount: 0,
          category: "",
          date: new Date().toLocaleDateString("en-CA"),
          isRecurring: false,
          note: "",
          recurrenceDate: undefined,
          type: values.type,
        });
      })}
    >
      <label className="flex flex-col gap-2 text-sm">
        <span>Date</span>
        <input
          type="date"
          {...form.register("date")}
          className="rounded-lg border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>Type</span>
        <select {...form.register("type")} className="rounded-lg border px-3 py-2">
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
          className="rounded-lg border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span>Amount</span>
        <input
          type="number"
          min={0}
          step={1}
          {...form.register("amount", { valueAsNumber: true })}
          className="rounded-lg border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm md:col-span-2">
        <span>Note</span>
        <input
          type="text"
          {...form.register("note")}
          placeholder="Optional note"
          className="rounded-lg border px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isRecurring")} />
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
          className="rounded-lg border px-3 py-2 disabled:opacity-50"
        />
      </label>

      <div className="md:col-span-4 flex items-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Quick Add"}
        </Button>
        {Object.values(form.formState.errors)[0] ? (
          <p className="text-sm text-destructive">
            {Object.values(form.formState.errors)[0]?.message as string}
          </p>
        ) : null}
      </div>
    </form>
  );
}
