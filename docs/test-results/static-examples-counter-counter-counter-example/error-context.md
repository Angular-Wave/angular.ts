# Test info

- Name: counter example
- Location:
  /home/anatoly/Applications/angular.ts/docs/static/examples/counter/counter.test.js:5:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "docs/static/examples/counter/counter-test.html", waiting until "load"

    at /home/anatoly/Applications/angular.ts/docs/static/examples/counter/counter.test.js:6:14
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | const TEST_URL = 'docs/static/examples/counter/counter-test.html';
   4 |
   5 | test('counter example', async ({ page }) => {
>  6 |   await page.goto(TEST_URL);
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
   7 |   await page.content();
   8 |
   9 |   // Locate the button
  10 |   const counterButton = page.locator('button');
  11 |
  12 |   // Verify initial count
  13 |   await expect(counterButton).toHaveText('Count is: 0');
  14 |
  15 |   // Click once
  16 |   await counterButton.click();
  17 |   await expect(counterButton).toHaveText('Count is: 1');
  18 |
  19 |   // Click again
  20 |   await counterButton.click();
  21 |   await expect(counterButton).toHaveText('Count is: 2');
  22 |
  23 |   // Click three more times
  24 |   await counterButton.click();
  25 |   await counterButton.click();
  26 |   await counterButton.click();
  27 |   await expect(counterButton).toHaveText('Count is: 5');
  28 | });
  29 |
```
