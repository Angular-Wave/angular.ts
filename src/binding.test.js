import { test, expect } from "@playwright/test";

test("src tests contain no errors", async ({ page }) => {
  await page.goto("src/binding.html");
  await page.content();
  await page.waitForTimeout(6000);
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});
