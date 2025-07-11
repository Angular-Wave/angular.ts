---
title: ng-mouseout
description: >
  Handler for mouseout event
---

### Description

The `ng-mouseout` directive allows you to specify custom behavior when a mouse
leaves any part of the element or its children.

### Directive parameters

---

#### `ng-mouseout`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [mouseout](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseout_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-mouseout="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-mouseout/ng-mouseout.html" >}}

{{< showraw src="examples/ng-mouseout/ng-mouseout.html" >}}

---
