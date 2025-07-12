---
title: ng-click
description: >
  Handler for click event
---

### Description

The `ng-click` directive allows you to specify custom behavior when an element
is clicked.

### Directive parameters

---

#### `ng-click`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Restrict:** `A`
- **Element:** ANY
- **Priority:** `0`
- **Description:** Expression to evaluate upon
  [click](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event)
  event.
  [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-click="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-click/ng-click.html" >}}

{{< showraw src="examples/ng-click/ng-click.html" >}}

---
