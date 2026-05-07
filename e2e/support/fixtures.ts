import { randomUUID } from "node:crypto";
import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { buildSessionCookie, resolveSessionIdentity, type SessionState } from "./auth";
import { createTestIdentity, TestDataManager, type TestIdentity } from "./db";

type Fixtures = {
  createPageForSession: (state?: SessionState) => Promise<Page>;
  db: TestDataManager;
  identity: TestIdentity;
};

export { expect } from "@playwright/test";

export const test = base.extend<Fixtures>({
  identity: async ({}, run, testInfo) => {
    const identity = createTestIdentity(
      `E2E ${testInfo.project.name} ${testInfo.workerIndex} ${randomUUID().slice(0, 8)}`,
    );
    await run(identity);
  },
  db: async ({ identity }, run) => {
    const manager = new TestDataManager(identity);
    await manager.ensureUser();

    try {
      await run(manager);
    } finally {
      await manager.cleanup();
    }
  },
  createPageForSession: async ({ baseURL, browser, identity }, run) => {
    const contexts: BrowserContext[] = [];

    async function createPageForSession(state: SessionState = "APPROVED_USER") {
      if (!baseURL) {
        throw new Error("Playwright baseURL is required.");
      }

      const context = await browser.newContext({
        acceptDownloads: true,
        baseURL,
      });
      contexts.push(context);

      const sessionIdentity = resolveSessionIdentity(state, identity);
      if (sessionIdentity) {
        const cookie = await buildSessionCookie(baseURL, sessionIdentity);
        await context.addCookies([cookie]);
      }

      return context.newPage();
    }

    try {
      await run(createPageForSession);
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  },
});
