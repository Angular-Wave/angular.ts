---
title: ng-mouseup
description: >
  Handler for mouseup event
---

### Description

The `ng-mouseup` directive allows you to specify custom behavior when a pressed
mouse is released over an element.

### Parameters

---

#### `ng-mouseup`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [mouseup](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseup_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-mouseup="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-mouseup/ng-mouseup.html" >}}

{{< showraw src="examples/ng-mouseup/ng-mouseup.html" >}}

---
