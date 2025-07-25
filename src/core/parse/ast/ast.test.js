import { test, expect } from "@playwright/test";

test("lexer unit tests contain no errors", async ({ page }) => {
  await page.goto("src/core/parse/ast/ast.html");
  await page.content();
  await page.waitForTimeout(3000);
  await expect(page.locator(".jasmine-overall-result")).toHaveText(
    /0 failures/,
  );
});
