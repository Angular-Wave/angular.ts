---
title: ng-keyup
description: >
  Handler for keyup event
---

### Description

The `ng-keyup` directive allows you to specify custom behavior when releasing
keys, regardless of whether they produce a character value.

### Directive parameters

---

#### `ng-keyup`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [keyup](https://developer.mozilla.org/en-US/docs/Web/API/Element/keyup_event)
  event.
  [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-keyup="$ctrl.greet($event)"></div>
  ```

---

#### Demo

{{< showhtml src="examples/ng-keyup/ng-keyup.html" >}}

{{< showraw src="examples/ng-keyup/ng-keyup.html" >}}

---
