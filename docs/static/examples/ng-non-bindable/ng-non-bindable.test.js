import { test, expect } from '@playwright/test';

const TEST_URL =
  'docs/static/examples/ng-non-bindable/ng-non-bindable-test.html';

test('ng-non-bindable example', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.content();

  await expect(page.locator('div[ng-non-bindable]')).toHaveText('{{ 2 + 2 }}');
});
