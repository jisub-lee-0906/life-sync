import assert from "node:assert/strict";
import test from "node:test";
import { AccessDeniedError, createApprovedUserGuard } from "./approved-user-guard.ts";

function guardFor(user: { id: string; role: "ADMIN" | "USER"; status: "PENDING" | "APPROVED" | "REJECTED" } | undefined) {
  return createApprovedUserGuard({
    hasDatabaseUrl: true,
    getSession: async () => ({ user: { id: "user-1" } }),
    findUser: async () => user,
  });
}

test("rejects a stale approved JWT claim when the current DB status is rejected", async () => {
  await assert.rejects(
    guardFor({ id: "user-1", role: "USER", status: "REJECTED" }).requireApprovedUser(),
    AccessDeniedError,
  );
});

test("rejects pending users from protected actions", async () => {
  await assert.rejects(
    guardFor({ id: "user-1", role: "USER", status: "PENDING" }).requireApprovedUser(),
    AccessDeniedError,
  );
});

test("rejects an admin JWT claim when the current DB role is no longer admin", async () => {
  await assert.rejects(
    guardFor({ id: "user-1", role: "USER", status: "APPROVED" }).requireApprovedAdmin(),
    AccessDeniedError,
  );
});

test("accepts a currently approved admin from the DB", async () => {
  const user = await guardFor({ id: "user-1", role: "ADMIN", status: "APPROVED" }).requireApprovedAdmin();
  assert.equal(user.id, "user-1");
});
