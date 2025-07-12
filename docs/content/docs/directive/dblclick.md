---
title: ng-dblclick
description: >
  Handler for dblclick event
---

### Description

The `ng-dblclick` directive allows you to specify custom behavior when an
element is double clicked.

### Directive parameters

---

#### `ng-dblclick`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Restrict:** `A`
- **Element:** ANY
- **Priority:** `0`
- **Description:** Expression to evaluate upon
  [dblclick](https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-dblclick="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-dblclick/ng-dblclick.html" >}}

{{< showraw src="examples/ng-dblclick/ng-dblclick.html" >}}

---
