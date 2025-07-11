---
title: ng-class-even
description: >
  Apply CSS classes to even-indexed elements inside `ng-repeat`.
---

### Description

The `ng-class-even` directive works just like [`ng-class`](./class), but it
applies only to **even-indexed** elements in an [`ng-repeat`](../repeat) block.

> Must be used inside `ng-repeat`.

### Animations

If `data-animate` attribute is present, the following animations will be applied
to the element:

| Animation                               | Occurs                                       |
| --------------------------------------- | -------------------------------------------- |
| [`add-class`](../../service/animate)    | Before the class is applied to the element   |
| [`remove-class`](../../service/animate) | Before the class is removed from the element |

### Directive parameters

---

#### `ng-class-even`

- **Type:** `string | array`
- **Description:** An expression evaluating to a space-delimited string or array
  of class names.
- **Example:**

  ```html
  <div ng-repeat="item in items" ng-class-even="'even-row'"></div>
  ```

---

### Demo

{{< showhtml src="examples/ng-class-even/ng-class-even.html" >}}

{{< showraw src="examples/ng-class-even/ng-class-even.html" >}}

---
