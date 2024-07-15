import { test, expect } from "@playwright/test";

test("unit state-directives tests contain no errors", async ({ page }) => {
  await page.goto("src/router/directives/state-directives.html");
  await page.content();
  await page.waitForTimeout(6000);
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});

test("unit view-directives tests contain no errors", async ({ page }) => {
  await page.goto("src/router/directives/view-directives.html");
  await page.content();
  await page.waitForTimeout(6000);
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});
