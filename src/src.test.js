import { test, expect } from "@playwright/test";

test("unitstate-directives tests contain no errors", async ({ page }) => {
  await page.goto("src/src.html");
  await page.content();
  await page.waitForTimeout(6000);
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});
