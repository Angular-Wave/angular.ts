# Test info

- Name: ng-non-bindable example
- Location: /home/anatoly/Applications/angular.ts/docs/static/examples/ng-non-bindable/ng-non-bindable.test.js:6:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "docs/static/examples/ng-non-bindable/ng-non-bindable-test.html", waiting until "load"

    at /home/anatoly/Applications/angular.ts/docs/static/examples/ng-non-bindable/ng-non-bindable.test.js:7:14
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | const TEST_URL =
   4 |   'docs/static/examples/ng-non-bindable/ng-non-bindable-test.html';
   5 |
   6 | test('ng-non-bindable example', async ({ page }) => {
>  7 |   await page.goto(TEST_URL);
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
   8 |   await page.content();
   9 |
  10 |   await expect(page.locator('div')).toHaveText('{{ 2 + 2 }}');
  11 | });
  12 |
```