---
title: ng-class
description: >
  Dynamically bind one or more CSS classes using expressions.
---

### Description

The `ng-class` directive allows dynamically setting CSS classes on an HTML
element by binding to an expression. The directive supports the following
expression types:

1. **String** — space-delimited class names.
2. **Object** — keys as class names and values as booleans. Truthy values add
   the class.
3. **Array** — containing strings and/or objects as described above.

When the expression changes:

- Previously added classes are removed.
- New classes are added.
- Duplicate classes are avoided.

**Important**: Avoid using interpolation (`{{ ... }}`) in the value of the
`class` attribute together with `ng-class`. See
[interpolation known issues](../../../docs/guide/interpolation#known-issues) for
details.

### Animations

If `data-animate` attribute is present, the following animations will be applied
to the element:

| Animation                               | Occurs                                              |
| --------------------------------------- | --------------------------------------------------- |
| [`add-class`](../../service/animate)    | Before the class is applied to the element          |
| [`remove-class`](../../service/animate) | Before the class is removed from the element        |
| [`set-class`](../../service/animate)    | Before classes are simultaneously added and removed |

> `ng-class` supports standard CSS3 transitions/animations even if they don’t
> follow `$animate` service naming conventions.

### Directive parameters

---

#### `ng-class`

- **Type:** `string | object | array`
- **Description:** An expression whose result determines the CSS classes to
  apply.
- **Example:**

  ```html
  <div ng-class="{ active: isActive, disabled: isDisabled }"></div>
  ```

### Example

{{< showhtml src="examples/ng-class/ng-class.html" >}}

### Demo

{{< showraw src="examples/ng-class/ng-class.html" >}}
