import test from "node:test";
import assert from "node:assert/strict";
import { resolveLoginRedirectTarget } from "./auth-redirect.ts";

test("uses the protected route callback from the login URL", () => {
  assert.equal(resolveLoginRedirectTarget("/settings/admin"), "/settings/admin");
});

test("falls back to finance when the callback is missing", () => {
  assert.equal(resolveLoginRedirectTarget(undefined), "/finance");
});

test("rejects protocol-relative callback targets", () => {
  assert.equal(resolveLoginRedirectTarget("//evil.example"), "/finance");
});
