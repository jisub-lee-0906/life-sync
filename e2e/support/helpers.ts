import type { Page, Request } from "@playwright/test";

export function formatYearMonth(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function formatDateOnly(date: Date) {
  return `${formatYearMonth(date)}-${`${date.getDate()}`.padStart(2, "0")}`;
}

export function isServerActionRequest(request: Request) {
  return request.method() === "POST" && Boolean(request.headers()["next-action"]);
}

export async function countServerActionRequests(page: Page, action: () => Promise<void> | void) {
  const requests: Request[] = [];
  const listener = (request: Request) => {
    if (isServerActionRequest(request)) {
      requests.push(request);
    }
  };

  page.on("request", listener);
  try {
    await action();
    await page.waitForTimeout(250);
  } finally {
    page.off("request", listener);
  }

  return requests;
}
