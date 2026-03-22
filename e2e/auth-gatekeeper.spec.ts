import { test, expect } from "./support/fixtures";

test.describe("auth gatekeeper", () => {
  test("redirects unauthenticated users to login", async ({ createPageForSession }) => {
    const page = await createPageForSession("UNAUTHENTICATED");

    await page.goto("/finance");

    await expect(page).toHaveURL(/\/login\?/);
    await expect(page.getByText("Sign in", { exact: true })).toBeVisible();
  });

  test("redirects pending users to the pending page", async ({ createPageForSession }) => {
    const page = await createPageForSession("PENDING");

    await page.goto("/finance");

    await expect(page).toHaveURL(/\/pending$/);
    await expect(page.getByText("Approval pending")).toBeVisible();
  });

  test("hides admin navigation and blocks admin route for approved non-admin users", async ({
    createPageForSession,
  }) => {
    const page = await createPageForSession("APPROVED_USER");

    await page.goto("/settings");

    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);

    await page.goto("/settings/admin");
    await expect(page).toHaveURL(/\/finance$/);
  });

  test("shows admin navigation and allows admin route for approved admins", async ({
    createPageForSession,
    db,
  }) => {
    await db.seedPendingUsers([{ name: "Awaiting Approval" }]);
    const page = await createPageForSession("APPROVED_ADMIN");

    await page.goto("/settings");

    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();

    await page.goto("/settings/admin");

    await expect(page).toHaveURL(/\/settings\/admin$/);
    await expect(page.getByText("Admin approvals")).toBeVisible();
    await expect(page.getByText("Awaiting Approval")).toBeVisible();
  });
});
