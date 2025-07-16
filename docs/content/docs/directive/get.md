---
title: ng-get
description: >
  Initiates a GET request
---

### Description

The `ng-get` directive allows you to fetch content via `$http` service from a
remote URL and insert, replace, or manipulate it into the DOM. In case of server
error, the directive displays the error in place of success result. This
behavior can be modified with error parameters below.

### Directive parameters

---

#### `ng-get`

- **Type:** `string`
- **Description:** A URL to issue a GET request to
- **Example:**

  ```html
  <div ng-get="/example">get</div>
  ```

---

### Directive parameters

#### `data-trigger`

- **Type:** `string`
- **Description:** Specifies the DOM event for triggering a request (default is
  `click`). For a complete list, see
  [UI Events](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events)
- **Example:**

  ```html
  <div ng-get="/example" trigger="mouseover">Get</div>
  ```

---

#### `data-latch`

- **Type:** `string`
- **Description:** Triggers a request whenever its value changes. Can Cn be used
  with interpolation (e.g., {{ expression }}) to observe reactive changes in the
  scope.
- **Example:**

  ```html
  <div ng-get="/example" latch="{{ latch }}" ng-mouseover="latch = !latch">
    Get
  </div>
  ```

---

#### `data-swap`

- **Type:** [SwapMode](../../../typedoc/variables/SwapMode.html)
- **Description:** Controls how the response is inserted
- **Example:**

  ```html
  <div ng-get="/example" swap="outerHTML">Get</div>
  ```

---

#### `data-target`

- **Type:**
  [selectors](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector#selectors)
- **Description:** Specifies a DOM element where the response should be rendered
- **Example:**

  ```html
  <div ng-get="/example" target=".test">Get</div>
  ```

---

#### `data-delay`

- **Type:**
  [delay](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#delay)
- **Description:** Delay request by N millisecond
- **Example:**

  ```html
  <div ng-get="/example" delay="1000">Get</div>
  ```

---

#### `data-interval`

- **Type:**
  [delay](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#delay)
- **Description:** Repeat request every N milliseconds
- **Example:**

  ```html
  <div ng-get="/example" interval="1000">Get</div>
  ```

---

#### `data-throttle`

- **Type:**
  [delay](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#delay)
- **Description:** Ignores subsequent requests for N millisecond
- **Example:**

  ```html
  <div ng-get="/example" throttle="1000">Get</div>
  ```

---

#### `data-loading`

- **Type:** N/A
- **Description:** Adds a data-loading="true/false" flag during request
  lifecycle.
- **Example:**

  ```html
  <div ng-get="/example" data-loading>Get</div>
  ```

---

#### `data-loading-class`

- **Type:** `string`
- **Description:** Toggles the specified class on the element while loading.
- **Example:**

  ```html
  <div ng-get="/example" data-loading-class="red">Get</div>
  ```

---

#### `data-success`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Evaluates expression when request succeeds. Response data is
  available as a `$res` property on the scope.
- **Example:**

  ```html
  <div ng-get="/example" success="message = $res">Get {{ message }}</div>
  ```

---

#### `data-error`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Evaluates expression when request fails. Response data is
  available as a `$res` property on the scope.
- **Example:**

  ```html
  <div ng-get="/example" error="errormessage = $res">
    Get {{ errormessage }}
  </div>
  ```

---

#### `data-success-state`

- **Type:** `string`
- **Description:** Name of the state to nagitate to when request succeeds
- **Example:**

  ```html
  <ng-view></ng-view>
  <div ng-get="/example" success-state="account">Get</div>
  ```

---

#### `data-success-error`

- **Type:** `string`
- **Description:** Name of the state to nagitate to when request fails
- **Example:**

  ```html
  <ng-view></ng-view>
  <div ng-get="/example" error-state="login">Get</div>
  ```

---
