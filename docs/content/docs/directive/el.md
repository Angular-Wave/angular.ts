---
title: ng-el
description: >
  Reference to an element
---

### Description

The `ng-el` directive allows you to store a reference to a DOM element in the
current `scope`, making it accessible elsewhere in your template or from your
controller. The reference is automatically removed if the element is removed
from the DOM.

### Parameters

---

#### `ng-el`

- **Type:** `string` (optional)
- **Description:** Name of the key under which the element will be stored in
  `scope`. If omitted, the element’s `id` attribute will be used.
- **Example:**

  ```html
  <div id="box" ng-el="$box"></div>
  ```

---

### Demo

{{< showhtml src="examples/ng-el/ng-el.html" >}}
{{< showraw src="examples/ng-el/ng-el.html" >}}

---
