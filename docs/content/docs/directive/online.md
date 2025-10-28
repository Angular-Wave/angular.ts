---
title: ng-online
description: >
  Handler for online event
---

### Description

The `ng-online` directive allows you to specify custom behavior when pressing
keys, regardless of whether they produce a character value.

### Parameters

---

#### `ng-online`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon `Window`
  [online](https://https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event)
  event. [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object
  is available as `$event`.
- **Example:**

  ```html
  <div ng-online="online = true">{{ online }}</div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-online/ng-online.html" >}}

{{< showraw src="examples/ng-online/ng-online.html" >}}

---
