---
title: ng-mousedown
description: >
  Handler for mousedown event
---

### Description

The `ng-mousedown` directive allows you to specify custom behavior when a mouse
is pressed over an element.

### Directive parameters

---

#### `ng-mousedown`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [mousedown](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-mousedown="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-mousedown/ng-mousedown.html" >}}

{{< showraw src="examples/ng-mousedown/ng-mousedown.html" >}}

---
