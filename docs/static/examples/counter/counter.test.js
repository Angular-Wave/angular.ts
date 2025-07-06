import { test, expect } from "@playwright/test";

const TEST_URL = "docs/static/examples/counter/counter-test.html";

test("counter example", async ({ page }) => {
  await page.goto(TEST_URL);
  await page.content();
 
  // Locate the button
  const counterButton = page.locator("button");

  // Verify initial count
  await expect(counterButton).toHaveText("Count is: 0");

  // Click once
  await counterButton.click();
  await expect(counterButton).toHaveText("Count is: 1");

  // Click again
  await counterButton.click();
  await expect(counterButton).toHaveText("Count is: 2");

  // Click three more times
  await counterButton.click();
  await counterButton.click();
  await counterButton.click();
  await expect(counterButton).toHaveText("Count is: 5");
});
