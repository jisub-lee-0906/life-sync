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
            setServerMessage("Preferences saved.");
          } catch (error) {
            setServerMessage(
              error instanceof Error ? error.message : "Failed to save preferences.",
            );
          }
        });
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span>Schedule icon</span>
          <input
            type="text"
            autoComplete="off"
            maxLength={10}
            {...form.register("scheduleIcon")}
            className="rounded-lg border px-3 py-2"
            placeholder="🗓️"
          />
          <span className="text-xs text-muted-foreground">
            Supports emoji and composed emoji sequences.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>Todo icon</span>
          <input
            type="text"
            autoComplete="off"
            maxLength={10}
            {...form.register("todoIcon")}
            className="rounded-lg border px-3 py-2"
            placeholder="✅"
          />
          <span className="text-xs text-muted-foreground">
            Keep the icon short so it works well in compact UI.
          </span>
        </label>
      </div>

      {form.formState.errors.scheduleIcon ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.scheduleIcon.message}
        </p>
      ) : null}

      {form.formState.errors.todoIcon ? (
        <p className="text-sm text-destructive">
          {form.formState.errors.todoIcon.message}
        </p>
      ) : null}

      {serverMessage ? (
        <p className="text-sm text-muted-foreground">{serverMessage}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}

