import test from "node:test";
import assert from "node:assert/strict";
import { isSettingsNavigationItemActive } from "./settings-navigation.ts";

test("marks the exact settings page as active", () => {
  assert.equal(isSettingsNavigationItemActive("/settings", "/settings"), true);
  assert.equal(isSettingsNavigationItemActive("/settings/backup", "/settings"), false);
});

test("marks the backup page only for its own route", () => {
  assert.equal(
    isSettingsNavigationItemActive("/settings/backup", "/settings/backup"),
    true,
  );
  assert.equal(isSettingsNavigationItemActive("/settings", "/settings/backup"), false);
});
