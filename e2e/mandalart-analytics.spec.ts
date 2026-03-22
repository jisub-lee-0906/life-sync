import { test, expect } from "./support/fixtures";
import { formatDateOnly, formatYearMonth } from "./support/helpers";

test.describe("mandalart and analytics", () => {
  test("reveals the mandalart detail view after selecting a cell", async ({
    createPageForSession,
    db,
  }) => {
    await db.seedMandalart({
      coreGoal: "Build LifeSync",
      cells: Array.from({ length: 8 }, (_, index) => ({
        goal: `Focus ${index + 1}`,
        isCompleted: index === 0,
        position: index + 1,
      })),
    });

    const page = await createPageForSession();

    await page.goto("/mandalart");
    await page.getByRole("button", { name: /Focus 1/ }).click();

    await expect(page.getByText("Focus node")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Focus 1" })).toBeVisible();
  });

  test("renders analytics charts without hydration errors", async ({
    createPageForSession,
    db,
  }) => {
    const currentDate = new Date();
    const currentMonth = formatYearMonth(currentDate);
    const dateKey = formatDateOnly(currentDate);

    await db.seedTransactions([
      {
        amount: 45000,
        category: "Food",
        date: dateKey,
        note: "Analytics expense",
        type: "EXPENSE",
      },
    ]);
    await db.seedTasks([
      {
        date: `${currentMonth}-01`,
        priority: "HIGH",
        progress: 100,
        title: "Completed analytics task",
        type: "FOCUS",
      },
      {
        date: `${currentMonth}-02`,
        priority: "LOW",
        progress: 40,
        title: "Open analytics task",
        type: "PLAN",
      },
    ]);

    const page = await createPageForSession();

    await page.goto("/analytics");

    await expect(page.locator("svg")).toHaveCount(1);
    await expect(page.locator("svg path").first()).toBeVisible();
    await expect(page.getByText("Completion rate")).toBeVisible();
  });
});
