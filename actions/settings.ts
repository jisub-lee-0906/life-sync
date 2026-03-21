"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { settings } from "@/drizzle/schema";
import { db, hasDatabaseUrl } from "@/lib/db";
import { iconPreferencesSchema, resolveIconPreferences } from "@/lib/settings";

async function requireSettingsUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!hasDatabaseUrl) {
    throw new Error("Database connection is not configured.");
  }

  return userId;
}

export async function updateIcons(input: {
  scheduleIcon: string;
  todoIcon: string;
}) {
  const userId = await requireSettingsUserId();
  const values = resolveIconPreferences(iconPreferencesSchema.parse(input));

  const [savedSettings] = await db
    .insert(settings)
    .values({
      scheduleIcon: values.scheduleIcon,
      todoIcon: values.todoIcon,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        scheduleIcon: values.scheduleIcon,
        todoIcon: values.todoIcon,
      },
      target: settings.userId,
    })
    .returning({
      scheduleIcon: settings.scheduleIcon,
      todoIcon: settings.todoIcon,
      userId: settings.userId,
    });

  revalidatePath("/settings");

  return savedSettings ?? {
    scheduleIcon: values.scheduleIcon,
    todoIcon: values.todoIcon,
    userId,
  };
}
