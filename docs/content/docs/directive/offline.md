---
title: ng-offline
description: >
  Handler for offline event
---

### Description

The `ng-offline` directive allows you to specify custom behavior when pressing
keys, regardless of whether they produce a character value.

### Parameters

---

#### `ng-offline`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon `Window`
  [offline](https://https://developer.mozilla.org/en-US/docs/Web/API/Window/offline_event)
  event. [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object
  is available as `$event`.
- **Example:**

  ```html
  <div ng-offline="offline = true">{{ offline }}</div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-offline/ng-offline.html" >}}

{{< showraw src="examples/ng-offline/ng-offline.html" >}}

---
