---
title: ng-mouseleave
description: >
  Handler for mouseleave event
---

### Description

The `ng-mouseleave` directive allows you to specify custom behavior when an
element a mouse leaves entire element.

### Parameters

---

#### `ng-mouseleave`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [mouseleave](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseleave_event)
  event.
  [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-mouseleave="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-mouseleave/ng-mouseleave.html" >}}

{{< showraw src="examples/ng-mouseleave/ng-mouseleave.html" >}}

---
