---
title: ng-mousemove
description: >
  Handler for mousemove event
---

### Description

The `ng-mousemove` directive allows you to specify custom custom behavior when a
mouse is moved over an element.

### Directive parameters

---

#### `ng-mousemove`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [mousemove](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-mousemove="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-mousemove/ng-mousemove.html" >}}

{{< showraw src="examples/ng-mousemove/ng-mousemove.html" >}}

---
