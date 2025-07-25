import { test, expect } from '@playwright/test';

const TEST_URL = 'docs/static/examples/eventbus/eventbus-test.html';

test('eventbus example', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.content();
  // Click the publish button
  await page.click('button.btn-dark');

  await expect(page.locator('b')).toHaveText(/^\d+$/, { timeout: 1000 });

  const updatedText = await page.locator('b').innerText();
  const timestamp = Number(updatedText);
  const now = Date.now();

  expect(timestamp).toBeGreaterThan(now - 5000); // allow 5 seconds slack
  expect(timestamp).toBeLessThanOrEqual(now);
});
