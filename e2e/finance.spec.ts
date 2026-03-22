import { test, expect } from "./support/fixtures";
import { formatDateOnly } from "./support/helpers";

test.describe("finance flows", () => {
  test("validates quick add input", async ({ createPageForSession }) => {
    const page = await createPageForSession();

    await page.goto("/finance");

    await page.getByRole("button", { name: "Quick Add" }).click();
    await expect(page.getByText(/too small|string must contain at least 1/i)).toBeVisible();

    await page.getByLabel("Category").fill("Groceries");
    await page.getByLabel("Amount").fill("-5");
    await page.getByRole("button", { name: "Quick Add" }).click();

    await expect(page.getByText(/greater than or equal to 0/i)).toBeVisible();
  });

  test("shows optimistic transaction rows before the create action settles", async ({
    createPageForSession,
  }) => {
    const page = await createPageForSession();
    let delayed = false;

    await page.route("**/*", async (route) => {
      const request = route.request();
      if (!delayed && request.method() === "POST" && request.headers()["next-action"]) {
        delayed = true;
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      await route.continue();
    });

    await page.goto("/finance");
    await page.getByLabel("Category").fill("Optimistic Lunch");
    await page.getByLabel("Amount").fill("12000");
    await page.getByLabel("Note").fill("Before network resolves");
    await page.getByRole("button", { name: "Quick Add" }).click();

    const optimisticCard = page.locator("div.rounded-2xl.border.p-4").filter({
      hasText: "Optimistic Lunch",
    }).first();

    await expect(optimisticCard).toContainText("Pending");
    await expect(optimisticCard).toContainText("Before network resolves");
    await expect.poll(() => delayed).toBe(true);
    await expect(optimisticCard).not.toContainText("Pending", { timeout: 10_000 });
    await expect(optimisticCard.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("loads the next transaction page on infinite scroll", async ({
    createPageForSession,
    db,
  }) => {
    const today = new Date();
    await db.seedTransactions(
      Array.from({ length: 40 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - index);
        return {
          amount: 1000 + index,
          category: `Scroll Item ${index + 1}`,
          date: formatDateOnly(date),
          note: `Row ${index + 1}`,
          type: "EXPENSE" as const,
        };
      }),
    );

    const page = await createPageForSession();
    const serverActions: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && request.headers()["next-action"]) {
        serverActions.push(request.url());
      }
    });

    await page.goto("/finance");

    await expect(page.getByText("Scroll Item 1")).toBeVisible();
    await expect(page.getByText("Scroll Item 21")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(20);

    await page.mouse.wheel(0, 8000);

    await expect(page.getByText("Scroll Item 21")).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(40);
    await expect.poll(() => serverActions.length).toBeGreaterThan(0);
  });

  test("uploads CSV data with formatted amounts", async ({ createPageForSession, db }) => {
    const page = await createPageForSession();

    await page.goto("/finance");

    await page.locator('input[type="file"]').setInputFiles({
      mimeType: "text/csv",
      name: "transactions.csv",
      buffer: Buffer.from(
        [
          "date,type,category,amount,note,isRecurring,recurrenceDate",
          '2026-03-22,EXPENSE,Rent,"1,250,000",Monthly rent,true,1',
          '2026-03-21,INCOME,Salary,"5,000,000",March salary,false,',
        ].join("\n"),
      ),
    });

    await expect(page.getByText("Rent")).toBeVisible();
    await expect(page.getByText("Salary")).toBeVisible();

    await expect.poll(async () => {
      const transactions = await db.readTransactions();
      return transactions.length;
    }).toBe(2);
  });
});
