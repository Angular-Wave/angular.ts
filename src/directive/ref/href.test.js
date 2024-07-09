import { test, expect } from "@playwright/test";

test("unit href tests contain no errors", async ({ page }) => {
  await page.goto("#src/directive/ref/href.spec.js");
  await page.content();
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});

test("unit ref tests contain no errors", async ({ page }) => {
  await page.goto("#src/directive/ref/ref.spec.js");
  await page.content();
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});
