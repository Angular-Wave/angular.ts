import { test, expect } from '@playwright/test';

test('unit tests contain no errors', async ({ page }) => {
  await page.goto('/?random=false');

  await page.content();
  // on average 15-17 seconds
  await page.waitForTimeout(20000)
  // Expect a jasmine bar to contain 0 failures
  await expect(page.locator('.jasmine-overall-result')).toHaveText(/0 failures/);
});

