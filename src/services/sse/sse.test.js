import { test, expect } from "@playwright/test";

const TEST_URL = "src/services/sse/sse.html";

test("unit tests contain no errors", async ({ page }) => {
  await page.goto(TEST_URL);
  await page.content();
  await page.waitForTimeout(1000 * 10); // 10 secs for now
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    / 0 failures/,
  );
});
