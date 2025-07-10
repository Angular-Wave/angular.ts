---
title: ng-class-odd
description: >
  Apply CSS classes to odd-indexed elements inside `ngRepeat`.
---

### Description

The `ng-class-odd` directive works just like [`ng-class`](../class), but it
applies only to **odd-indexed** elements inside an [`ng-repeat`](../repeat)
block.

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

#### `ng-class-odd`

- **Type:** `string | array`
- **Description:** An expression evaluating to a space-delimited string or array
  of class names.
- **Example:**

  ```html
  <div ng-repeat="item in items" ng-class-odd="'odd-row'"></div>
  ```

---

### Example

{{< showhtml src="examples/ng-class-odd/ng-class-odd.html" >}}

### Demo

{{< showraw src="examples/ng-class-odd/ng-class-odd.html" >}}
