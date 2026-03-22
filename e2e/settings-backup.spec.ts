import { readFile } from "node:fs/promises";
import { test, expect } from "./support/fixtures";
import { formatDateOnly } from "./support/helpers";

test.describe("settings and backup", () => {
  test("accepts a family emoji in icon preferences", async ({ createPageForSession, db }) => {
    await db.seedSettings({
      scheduleIcon: "📅",
      todoIcon: "✅",
    });

    const page = await createPageForSession();

    await page.goto("/settings");
    await page.getByLabel("Schedule icon").fill("👨‍👩‍👧‍👦");
    await page.getByRole("button", { name: "Save preferences" }).click();

    await expect(page.getByText("Preferences saved.")).toBeVisible();
    await expect(page.getByText(/too big|too small/i)).toHaveCount(0);
    await expect.poll(async () => {
      const settings = await db.readSettings();
      return settings?.scheduleIcon ?? "";
    }).toBe("👨‍👩‍👧‍👦");
  });

  test("downloads a full JSON backup", async ({ createPageForSession, db }) => {
    const dateKey = formatDateOnly(new Date());
    await db.seedSettings({
      scheduleIcon: "📅",
      todoIcon: "✅",
    });
    await db.seedTransactions([
      {
        amount: 3300,
        category: "Backup transaction",
        date: dateKey,
        note: "Included in backup",
        type: "EXPENSE",
      },
    ]);
    await db.seedTasks([
      {
        date: dateKey,
        priority: "HIGH",
        progress: 100,
        title: "Backup task",
        type: "FOCUS",
      },
    ]);
    await db.seedRoutines([{ title: "Backup routine", sunCheck: true }]);
    await db.seedMandalart({
      coreGoal: "Archive data",
      cells: Array.from({ length: 8 }, (_, index) => ({
        goal: `Archive node ${index + 1}`,
        position: index + 1,
      })),
    });

    const page = await createPageForSession();

    await page.goto("/settings");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download full backup" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    expect(download.suggestedFilename()).toMatch(/^lifesync-backup-.*\.json$/);
    expect(downloadPath).not.toBeNull();

    const fileContents = await readFile(downloadPath!, "utf8");
    const payload = JSON.parse(fileContents) as Record<string, unknown>;

    expect(payload).toMatchObject({
      settings: {
        scheduleIcon: "📅",
        todoIcon: "✅",
      },
      version: "1.0",
    });
    expect(Array.isArray(payload.transactions)).toBe(true);
  });
});
