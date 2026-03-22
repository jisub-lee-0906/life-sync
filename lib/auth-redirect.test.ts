import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLoginCallbackUrl,
  resolveLoginRedirectTarget,
} from "./auth-redirect.ts";

test("uses the protected route callback from the login URL", () => {
  assert.equal(resolveLoginRedirectTarget("/settings/admin"), "/settings/admin");
});

test("falls back to finance when the callback is missing", () => {
  assert.equal(resolveLoginRedirectTarget(undefined), "/finance");
});

test("rejects protocol-relative callback targets", () => {
  assert.equal(resolveLoginRedirectTarget("//evil.example"), "/finance");
});

test("preserves the original search params in the callback target", () => {
  assert.equal(
    buildLoginCallbackUrl("/finance", "?range=month&view=chart"),
    "/finance?range=month&view=chart",
  );
});
