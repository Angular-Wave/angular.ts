---
title: ng-class
description: >
  Dynamically bind one or more CSS classes using expressions.
---

### Description

The `ng-class` directive allows dynamically setting CSS classes on an HTML element by binding to an expression. The directive supports the following expression types:

1. **String** — space-delimited class names.
2. **Object** — keys as class names and values as booleans. Truthy values add the class.
3. **Array** — containing strings and/or objects as described above.

When the expression changes:
- Previously added classes are removed.
- New classes are added.
- Duplicate classes are avoided.

> Also see [ng-class API](../../../typedoc/directives/ngClass.html).

### Known Issues

Avoid using interpolation (`{{ ... }}`) in the `class` attribute together with `ngClass`.  
See [interpolation known issues](../../../docs/guide/interpolation#known-issues) for details.

### Animations

| Animation                                     | Occurs                                                   |
|-----------------------------------------------|-----------------------------------------------------------|
| [`addClass`](../../../typedoc/services/$animate.html#addClass)           | Before the class is applied to the element               |
| [`removeClass`](../../../typedoc/services/$animate.html#removeClass)     | Before the class is removed from the element             |
| [`setClass`](../../../typedoc/services/$animate.html#setClass)           | Before classes are simultaneously added and removed      |

> `ngClass` supports standard CSS3 transitions/animations even if they don’t follow ngAnimate naming conventions.

### Parameters

------

#### `ngClass`

- **Type:** `string | object | array`
- **Description:** An AngularJS expression whose result determines the CSS classes to apply.
- **Example:**

    ```html
    <div ng-class="{ active: isActive, disabled: isDisabled }"></div>
    ```

---

---
title: ngClassOdd
description: >
  Apply CSS classes to odd-indexed elements inside `ngRepeat`.
---

### Description

The `ngClassOdd` directive works just like [`ngClass`](./ngClass), but only applies classes to **odd-indexed** elements inside an [`ngRepeat`](../../../typedoc/directives/ngRepeat.html) loop.

> Must be used inside `ngRepeat`.

### Animations

| Animation                                     | Occurs                                                   |
|-----------------------------------------------|-----------------------------------------------------------|
| [`addClass`](../../../typedoc/services/$animate.html#addClass)           | Before the class is applied to the element               |
| [`removeClass`](../../../typedoc/services/$animate.html#removeClass)     | Before the class is removed from the element             |

### Parameters

------

#### `ngClassOdd`

- **Type:** `string | array`
- **Description:** An AngularJS expression evaluating to a space-delimited string or array of class names.
- **Example:**

    ```html
    <div ng-repeat="item in items" ng-class-odd="'odd-row'"></div>
    ```

---

---
title: ngClassEven
description: >
  Apply CSS classes to even-indexed elements inside `ngRepeat`.
---

### Description

The `ngClassEven` directive is like [`ngClass`](./ngClass), but it applies only to **even-indexed** elements in an [`ngRepeat`](../../../typedoc/directives/ngRepeat.html) block.

> Must be used inside `ngRepeat`.

### Animations

| Animation                                     | Occurs                                                   |
|-----------------------------------------------|-----------------------------------------------------------|
| [`addClass`](../../../typedoc/services/$animate.html#addClass)           | Before the class is applied to the element               |
| [`removeClass`](../../../typedoc/services/$animate.html#removeClass)     | Before the class is removed from the element             |

### Parameters

------

#### `ngClassEven`

- **Type:** `string | array`
- **Description:** An AngularJS expression evaluating to a space-delimited string or array of class names.
- **Example:**

    ```html
    <div ng-repeat="item in items" ng-class-even="'even-row'"></div>
    ```

---
