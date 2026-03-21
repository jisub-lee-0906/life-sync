"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, hasDatabaseUrl } from "@/lib/db";
import { users } from "@/drizzle/schema";

async function assertAdmin() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function updateUserStatus(userId: string, status: "APPROVED" | "REJECTED") {
  await assertAdmin();

  if (!hasDatabaseUrl) {
    throw new Error("Database connection is not configured.");
  }

  await db.update(users).set({ status }).where(eq(users.id, userId));
}

export async function approveUser(userId: string) {
  await updateUserStatus(userId, "APPROVED");
}

export async function rejectUser(userId: string) {
  await updateUserStatus(userId, "REJECTED");
}
