"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { requireApprovedAdmin } from "@/lib/server-auth";

async function assertAdmin() {
  await requireApprovedAdmin();
}

async function updateUserStatus(userId: string, status: "APPROVED" | "REJECTED") {
  await assertAdmin();
  await db.update(users).set({ status }).where(eq(users.id, userId));
}

export async function approveUser(userId: string) {
  await updateUserStatus(userId, "APPROVED");
}

export async function rejectUser(userId: string) {
  await updateUserStatus(userId, "REJECTED");
}
