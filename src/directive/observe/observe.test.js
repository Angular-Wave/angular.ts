import { test, expect } from "@playwright/test";

test("unit observer tests contain no errors", async ({ page }) => {
  await page.goto("src/directive/observe/observe.html");
  await page.content();
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});
