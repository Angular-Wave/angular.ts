---
title: ng-blur
description: >
  Handler for blur event
---

### Description

The `ng-blur` directive allows you to specify custom behavior when an element
loses focus.

### Directive parameters

---

#### `ng-blur`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event)
  event.
  [FocusEvent](https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-blur="$ctrl.handleBlur($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-blur/ng-blur.html" >}}

{{< showraw src="examples/ng-blur/ng-blur.html" >}}

---
