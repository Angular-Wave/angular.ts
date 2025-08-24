import { test, expect } from "@playwright/test";

test("raf-scheduler unit tests contain no errors", async ({ page }) => {
  await page.goto("src/animations/raf-scheduler.html");
  await page.content();

  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    / 0 failures/,
  );
});
