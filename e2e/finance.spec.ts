import { test, expect } from "./support/fixtures";
import { formatDateOnly } from "./support/helpers";

test.describe("finance flows", () => {
  test("shows monthly expense, income, and net summary with category totals", async ({
    createPageForSession,
    db,
  }) => {
    await db.seedTransactions([
      {
        amount: 12000,
        category: "식비",
        date: "2026-03-22",
        note: "점심",
        type: "EXPENSE",
      },
      {
        amount: 3000,
        category: "교통비",
        date: "2026-03-21",
        note: "버스",
        type: "EXPENSE",
      },
      {
        amount: 50000,
        category: "월급",
        date: "2026-03-01",
        note: "급여",
        type: "INCOME",
      },
    ]);

    const page = await createPageForSession();
    await page.goto("/finance");

    await expect(page.getByText("총 지출")).toBeVisible();
    await expect(page.getByText("15,000원")).toBeVisible();
    await expect(page.getByText("총 수입")).toBeVisible();
    await expect(page.getByText("50,000원")).toBeVisible();
    await expect(page.getByText("총 합계")).toBeVisible();
    await expect(page.getByText("35,000원")).toBeVisible();
    await expect(page.getByRole("heading", { name: "분류별 지출" })).toBeVisible();
    await expect(page.getByText("식비")).toBeVisible();
    await expect(page.getByText("12,000원")).toBeVisible();
  });

  test("keeps the submit button accessible on mobile and saves Korean text without truncation", async ({
    createPageForSession,
  }) => {
    const page = await createPageForSession();
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/finance");
    await page.getByRole("button", { name: /내역 추가하기/ }).click();

    const submitButton = page.getByRole("button", { name: "내역 추가하기" }).last();
    await expect(submitButton).toBeVisible();

    await page.getByLabel("금액").fill("12000");
    await page.getByLabel("메모").fill("테스트 메모");
    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();

    await page.getByLabel("구분").selectOption("EXPENSE");
    await page.getByLabel("분류").selectOption({ label: "교통비" });
    await submitButton.click();

    await expect(page.getByText("교통비")).toBeVisible();
    await expect(page.getByText("테스트 메모")).toBeVisible();
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
    await page.getByRole("button", { name: /내역 추가하기/ }).click();
    await page.getByLabel("금액").fill("12000");
    await page.getByLabel("분류").selectOption({ label: "식비" });
    await page.getByLabel("메모").fill("Before network resolves");
    await page.getByRole("button", { name: "내역 추가하기" }).last().click();

    const optimisticCard = page.locator("div").filter({ hasText: "식비" }).filter({ hasText: "Before network resolves" }).first();

    await expect(optimisticCard).toBeVisible();
    await expect.poll(() => delayed).toBe(true);
    await expect(optimisticCard.getByRole("button", { name: "수정" })).toBeVisible({ timeout: 10_000 });
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
          category: `스크롤 항목 ${index + 1}`,
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

    await expect(page.getByText("스크롤 항목 1")).toBeVisible();
    await expect(page.getByText("스크롤 항목 21")).toHaveCount(0);

    await page.mouse.wheel(0, 8000);

    await expect(page.getByText("스크롤 항목 21")).toBeVisible();
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
          '2026-03-22,EXPENSE,주거,"1,250,000",Monthly rent,true,1',
          '2026-03-21,INCOME,월급,"5,000,000",March salary,false,',
        ].join("\n"),
      ),
    });

    await expect(page.getByText("주거")).toBeVisible();
    await expect(page.getByText("월급")).toBeVisible();

    await expect.poll(async () => {
      const transactions = await db.readTransactions();
      return transactions.length;
    }).toBe(2);
  });
});
