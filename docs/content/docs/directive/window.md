---
title: ng-window-*
description: >
  Handler for window events
---

### Description

The `ng-window-*` directive allows you to specify custom behavior for events
dispatched from `Window` object. The event name is defined by including it in
the placeholder of directive's name. Example: `ng-window-online` will bind the
directive to the `online` event. For a full list of standard options, see
[events](https://developer.mozilla.org/en-US/docs/Web/API/Window#events).

### Parameters

---

#### `ng-window-*`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon event dispatch.
  [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is
  available as `$event`.
- **Example:**

  ```html
  <div ng-window-message="data = $event.message.date">{{ data }}</div>
  ```

---

#### Demo

{{< showdemo src="examples/ng-window/ng-window.html" >}}

---
