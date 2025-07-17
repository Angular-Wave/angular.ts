---
title: ng-mouseenter
description: >
  Handler for mouseenter event
---

### Description

The `ng-mouseenter` directive allows you to specify custom behavior when a mouse
enters an element.

### Parameters

---

#### `ng-mouseenter`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [mouseenter](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-mouseenter="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-mouseenter/ng-mouseenter.html" >}}

{{< showraw src="examples/ng-mouseenter/ng-mouseenter.html" >}}

---
