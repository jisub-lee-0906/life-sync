import test from "node:test";
import assert from "node:assert/strict";
import { isSettingsNavigationItemActive } from "./settings-navigation.ts";

test("marks the preferences item active only when no section hash is selected", () => {
  assert.equal(isSettingsNavigationItemActive("/settings", "", "/settings"), true);
  assert.equal(
    isSettingsNavigationItemActive("/settings", "#data-backup", "/settings"),
    false,
  );
});

test("marks the data backup item active only for its hash target", () => {
  assert.equal(
    isSettingsNavigationItemActive(
      "/settings",
      "#data-backup",
      "/settings#data-backup",
    ),
    true,
  );
  assert.equal(
    isSettingsNavigationItemActive("/settings", "", "/settings#data-backup"),
    false,
  );
});
