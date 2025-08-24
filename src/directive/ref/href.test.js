import { test, expect } from "@playwright/test";

test("unit href tests contain no errors", async ({ page }) => {
  await page.goto("src/directive/ref/href.html");
  await page.content();
  await page.waitForTimeout(1000);
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    / 0 failures/,
  );
});

test("unit ref tests contain no errors", async ({ page }) => {
  await page.goto("src/directive/ref/ref.html");
  await page.content();
  await page.waitForTimeout(1000);
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    / 0 failures/,
  );
});
