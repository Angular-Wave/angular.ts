---
title: ng-focus
description: >
  Handler for focus event
---

### Description

The `ng-focus` directive allows you to specify custom behavior when an element
is focused.

### Directive parameters

---

#### `ng-focus`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [focus](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event)
  event.
  [FocusEvent](https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-focus="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-focus/ng-focus.html" >}}

{{< showraw src="examples/ng-focus/ng-focus.html" >}}

---
