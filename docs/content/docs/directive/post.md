---
title: ng-post
description: >
  Initiates a POST request
---

### Description

The `ng-post` directive allows you to fetch content via `$http` service from a
remote URL and insert, replace, or manipulate it into the DOM. The directive
assumes a response will be HTML content. If the server endpoint returns a
JSON-response, the directive will treat it as an object to be merged into the
current scope. In such a case, the swap strategy will be ignored and the content
will be interpolated into current scope.

#### Example

```html
<section>
  <div ng-post="/json">Get</div>
  <!-- Enpoint returns {name: 'Bob'}-->
  {{ name }}
  <!-- 'Bob' will be merged into current scope -->
</section>
```

In case of error, the directive displays the error in place of success result.
This behavior can be modified with error parameters below.

### Parameters

---

#### `ng-post`

- **Type:** `string`
- **Description:** A URL to issue a GET request to
- **Example:**

  ```html
  <div ng-post="/example">post</div>
  ```

---

### Modifiers

#### `data-trigger`

- **Type:** `string`
- **Description:** Specifies the DOM event for triggering a request (default is
  `click`). For a complete list, see
  [UI Events](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events). To
  eagerly execute a request without user interaction, use the "load" event,
  which is triggered syntheticaly on any element by the directive linking
  function. This is in contract to the native
  [load](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event),
  which executes lazily only for `window` object and certain resource elements.
- **Example:**

  ```html
  <div ng-post="/example" trigger="mouseover">Get</div>
  ```

---

#### `data-latch`

- **Type:** `string`
- **Description:** Triggers a request whenever its value changes. This attribute
  can be used with interpolation (e.g., {{ expression }}) to observe reactive
  changes in the scope.
- **Example:**

  ```html
  <div ng-post="/example" latch="{{ latch }}" ng-mouseover="latch = !latch">
    Get
  </div>
  ```

---

#### `data-swap`

- **Type:** [SwapMode](../../../typedoc/variables/SwapMode.html)
- **Description:** Controls how the response is inserted
- **Example:**

  ```html
  <div ng-post="/example" swap="outerHTML">Get</div>
  ```

---

#### `data-tarpost`

- **Type:**
  [selectors](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector#selectors)
- **Description:** Specifies a DOM element where the response should be rendered
- **Example:**

  ```html
  <div ng-post="/example" tarpost=".test">Get</div>
  ```

---

#### `data-delay`

- **Type:**
  [delay](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#delay)
- **Description:** Delay request by N millisecond
- **Example:**

  ```html
  <div ng-post="/example" delay="1000">Get</div>
  ```

---

#### `data-interval`

- **Type:**
  [delay](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#delay)
- **Description:** Repeat request every N milliseconds
- **Example:**

  ```html
  <div ng-post="/example" interval="1000">Get</div>
  ```

---

#### `data-throttle`

- **Type:**
  [delay](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#delay)
- **Description:** Ignores subsequent requests for N milliseconds
- **Example:**

  ```html
  <div ng-post="/example" throttle="1000">Get</div>
  ```

---

#### `data-loading`

- **Type:** N/A
- **Description:** Adds a data-loading="true/false" flag during request
  lifecycle.
- **Example:**

  ```html
  <div ng-post="/example" data-loading>Get</div>
  ```

---

#### `data-loading-class`

- **Type:** `string`
- **Description:** Toggles the specified class on the element while loading.
- **Example:**

  ```html
  <div ng-post="/example" data-loading-class="red">Get</div>
  ```

---

#### `data-success`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Evaluates expression when request succeeds. Response data is
  available as a `$res` property on the scope.
- **Example:**

  ```html
  <div ng-post="/example" success="message = $res">Get {{ message }}</div>
  ```

---

#### `data-error`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Evaluates expression when request fails. Response data is
  available as a `$res` property on the scope.
- **Example:**

  ```html
  <div ng-post="/example" error="errormessage = $res">
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
  <div ng-post="/example" success-state="account">Get</div>
  ```

---

#### `data-success-error`

- **Type:** `string`
- **Description:** Name of the state to nagitate to when request fails
- **Example:**

  ```html
  <ng-view></ng-view>
  <div ng-post="/example" error-state="login">Get</div>
  ```

---
