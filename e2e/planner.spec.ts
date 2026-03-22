import { test, expect } from "./support/fixtures";
import { formatDateOnly } from "./support/helpers";

test.describe("planner flows", () => {
  test("renders calendar summaries and opens the detail drawer", async ({
    createPageForSession,
    db,
  }) => {
    const currentDate = new Date();
    const dateKey = formatDateOnly(currentDate);

    await db.seedTransactions([
      {
        amount: 1234,
        category: "Coffee",
        date: dateKey,
        note: "Calendar expense",
        type: "EXPENSE",
      },
      {
        amount: 5000,
        category: "Freelance",
        date: dateKey,
        note: "Calendar income",
        type: "INCOME",
      },
    ]);
    await db.seedTasks([
      {
        date: dateKey,
        priority: "HIGH",
        progress: 100,
        title: "Done task",
        type: "FOCUS",
      },
      {
        date: dateKey,
        priority: "MEDIUM",
        progress: 20,
        title: "Open task",
        type: "PLAN",
      },
    ]);

    const page = await createPageForSession();

    await page.goto("/calendar");

    const dayCard = page.getByRole("button").filter({ hasText: "2 tasks" }).first();
    await expect(dayCard).toContainText("1 done");
    await expect(dayCard).toContainText("1,234");

    await dayCard.click();

    await expect(page.getByRole("heading", { name: dateKey })).toBeVisible();
    await expect(page.getByText("Coffee")).toBeVisible();
    await expect(page.getByText("Done task")).toBeVisible();
  });

  test("sends no task progress request until the slider is released", async ({
    createPageForSession,
    db,
  }) => {
    const dateKey = formatDateOnly(new Date());
    await db.seedTasks([
      {
        date: dateKey,
        priority: "HIGH",
        progress: 0,
        title: "Slider task",
        type: "FOCUS",
      },
    ]);

    const page = await createPageForSession();
    let requestCount = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.headers()["next-action"]) {
        requestCount += 1;
      }
    });

    await page.goto("/todo-routine");

    const slider = page.getByRole("slider").first();
    const box = await slider.boundingBox();
    if (!box) {
      throw new Error("Task slider bounding box was not available.");
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 12 });
    await page.waitForTimeout(300);
    expect(requestCount).toBe(0);

    await page.mouse.up();

    await expect.poll(() => requestCount).toBe(1);
  });

  test("toggles routine checks and calls the server action", async ({
    createPageForSession,
    db,
  }) => {
    await db.seedRoutines([{ title: "Morning stretch", monCheck: false }]);
    const page = await createPageForSession();
    let requestCount = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.headers()["next-action"]) {
        requestCount += 1;
      }
    });

    await page.goto("/todo-routine");

    const checkbox = page.getByRole("checkbox").first();
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();

    await expect(checkbox).toBeChecked();
    await expect.poll(() => requestCount).toBe(1);
  });
});
