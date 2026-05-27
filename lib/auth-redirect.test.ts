import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLoginCallbackUrl,
  buildRequestUrl,
  resolveLoginRedirectTarget,
  resolveRequestOrigin,
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

test("rejects public callback targets like login", () => {
  assert.equal(resolveLoginRedirectTarget("/login?callbackUrl=/settings"), "/finance");
});

test("preserves the original search params in the callback target", () => {
  assert.equal(
    buildLoginCallbackUrl("/finance", "?range=month&view=chart"),
    "/finance?range=month&view=chart",
  );
});

test("prefers the incoming host headers over an env-pinned origin", () => {
  const request = {
    headers: new Headers({
      host: "127.0.0.1:3000",
      "x-forwarded-proto": "http",
    }),
    nextUrl: {
      origin: "http://jq5m43c50rdy92m0mlpl338o.175.205.238.91.sslip.io",
    },
  };

  assert.equal(resolveRequestOrigin(request), "http://127.0.0.1:3000");
  assert.equal(
    buildRequestUrl(request, "/login").toString(),
    "http://127.0.0.1:3000/login",
  );
});
