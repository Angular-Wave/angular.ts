---
title: ng-mouseover
description: >
  Handler for mouseover event
---

### Description

The `ng-mouseover` directive allows you to specify custom behavior when a mouse
is placed over an element.

### Directive parameters

---

#### `ng-mouseover`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [mouseover](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-mouseover="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-mouseover/ng-mouseover.html" >}}

{{< showraw src="examples/ng-mouseover/ng-mouseover.html" >}}

---
