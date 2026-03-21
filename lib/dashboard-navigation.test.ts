import test from "node:test";
import assert from "node:assert/strict";
import {
  getDashboardRouteMeta,
  isDashboardRouteActive,
} from "./dashboard-navigation.ts";

test("marks nested settings routes as active for the settings nav item", () => {
  assert.equal(isDashboardRouteActive("/settings/admin", "/settings"), true);
});

test("keeps unrelated dashboard routes inactive", () => {
  assert.equal(isDashboardRouteActive("/analytics", "/settings"), false);
});

test("returns admin metadata for the admin settings page", () => {
  assert.deepEqual(getDashboardRouteMeta("/settings/admin"), {
    description: "Pending approvals",
    label: "Admin",
  });
});
