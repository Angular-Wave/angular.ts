---
title: ng-keydown
description: >
  Handler for keydown event
---

### Description

The `ng-keydown` directive allows you to specify custom behavior when pressing
keys, regardless of whether they produce a character value.

### Directive parameters

---

#### `ng-keydown`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [keydown](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event)
  event.
  [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-keydown="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-keydown/ng-keydown.html" >}}

{{< showraw src="examples/ng-keydown/ng-keydown.html" >}}

---
