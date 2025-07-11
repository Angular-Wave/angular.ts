---
title: ng-copy
description: >
  Handler for copy event
---

### Description

The `ng-copy` directive allows you to specify custom behavior when an element is
copyed.

### Directive parameters

---

#### `ng-copy`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [copy](https://developer.mozilla.org/en-US/docs/Web/API/Element/copy_event)
  event.
  [PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div ng-copy="$ctrl.greet($event)"></div>
  ```

---

### Demo

{{< showhtml src="examples/ng-copy/ng-copy.html" >}}

{{< showraw src="examples/ng-copy/ng-copy.html" >}}

---
