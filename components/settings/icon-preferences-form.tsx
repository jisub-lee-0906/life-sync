"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateIcons } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import {
  iconPreferencesSchema,
  resolveIconPreferences,
  type IconPreferencesInput,
} from "@/lib/settings";

type IconPreferencesFormProps = {
  initialValues: IconPreferencesInput;
};

export function IconPreferencesForm({
  initialValues,
}: IconPreferencesFormProps) {
  const defaults = resolveIconPreferences(initialValues);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<IconPreferencesInput>({
    defaultValues: defaults,
    resolver: zodResolver(iconPreferencesSchema),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        setServerMessage(null);
        startTransition(async () => {
          try {
            const saved = await updateIcons(values);
            form.reset(resolveIconPreferences(saved));
            setServerMessage("설정을 저장했어요.");
          } catch (error) {
            setServerMessage(error instanceof Error ? error.message : "설정을 저장하지 못했어요.");
          }
        });
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span>캘린더 아이콘</span>
          <input
            type="text"
            autoComplete="off"
            maxLength={10}
            {...form.register("scheduleIcon")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-primary"
            placeholder="🗓️"
          />
          <span className="text-xs text-muted-foreground">
            지금 쓰는 이모지를 그대로 넣으면 더 깔끔해요.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>할 일 아이콘</span>
          <input
            type="text"
            autoComplete="off"
            maxLength={10}
            {...form.register("todoIcon")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all duration-200 focus:border-primary"
            placeholder="✅"
          />
          <span className="text-xs text-muted-foreground">
            한눈에 알아보기 쉬운 아이콘을 추천해요.
          </span>
        </label>
      </div>

      {form.formState.errors.scheduleIcon ? (
        <p className="text-sm text-destructive">{form.formState.errors.scheduleIcon.message}</p>
      ) : null}

      {form.formState.errors.todoIcon ? (
        <p className="text-sm text-destructive">{form.formState.errors.todoIcon.message}</p>
      ) : null}

      {serverMessage ? <p className="text-sm text-muted-foreground">{serverMessage}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "저장하고 있어요" : "저장하기"}
      </Button>
    </form>
  );
}
