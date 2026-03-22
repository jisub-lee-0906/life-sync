import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { PlannerStoreProvider, usePlannerStore } from "@/store";

function SelectedDateValue() {
  const selectedDate = usePlannerStore((state) => state.selectedDate);
  return React.createElement("span", null, selectedDate ?? "none");
}

test("PlannerStoreProvider scopes store state per mounted tree", () => {
  const firstRender = renderToString(
    React.createElement(
      PlannerStoreProvider,
      { initialState: { selectedDate: "2026-03-22" } },
      React.createElement(SelectedDateValue),
    ),
  );

  const secondRender = renderToString(
    React.createElement(
      PlannerStoreProvider,
      { initialState: { selectedDate: "2026-03-23" } },
      React.createElement(SelectedDateValue),
    ),
  );

  assert.match(firstRender, /2026-03-22/);
  assert.match(secondRender, /2026-03-23/);
});
