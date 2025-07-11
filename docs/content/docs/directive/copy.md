---
title: ng-copy
description: >
  Handler for copy event
---

### Description

The `ng-copy` directive allows you to specify custom behavior when an element is
copied.

### Directive parameters

---

#### `ng-copy`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [copy](https://developer.mozilla.org/en-US/docs/Web/API/Element/copy_event)
  event.
  [ClipboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent)
  object is available as `$event`.
- **Example:**

  ```html
  <div contenteditable="true" ng-copy="$ctrl.greet($event)">Content</div>
  ```

---

### Demo

{{< showhtml src="examples/ng-copy/ng-copy.html" >}}

{{< showraw src="examples/ng-copy/ng-copy.html" >}}

---
