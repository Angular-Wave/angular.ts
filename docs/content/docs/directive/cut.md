---
title: ng-cut
description: >
  Handler for cut event
---

### Description

The `ng-cut` directive allows you to specify custom behavior when an element is
cut.

### Directive parameters

---

#### `ng-cut`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Description:** Expression to evaluate upon
  [cut](https://developer.mozilla.org/en-US/docs/Web/API/Element/cut_event)
  event.
  [ClipboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent)
  object is available as `$event`.

- **Example:**

  ```html
  <div contenteditable="true" ng-cut="$ctrl.onCut($event)">
    Cuttable content
  </div>
  ```

---

### Demo

{{< showhtml src="examples/ng-cut/ng-cut.html" >}}
{{< showraw src="examples/ng-cut/ng-cut.html" >}}

---
