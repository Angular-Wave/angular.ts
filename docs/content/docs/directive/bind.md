---
title: ng-bind
description: >
  Sync or hydrate textContent of element with an expression
---

### Description

The `ng-bind` attribute places the text content of the specified HTML element
with the value of a given expression, and to update the text content when the
value of that expression changes.

Typically, you don't use `ng-bind` directly, but instead you use the double
curly markup like `{{ expression }}` which is similar but less verbose.

It is preferable to use `ng-bind` instead of `{{ expression }}` if a template is
momentarily displayed by the browser in its raw state before it is compiled.
Since `ng-bind` is an element attribute, it makes the bindings invisible to the
user while the page is loading.

An alternative solution to this problem would be using the `ng-cloak` directive.

`ng-bind` can be modified with a `data-lazy` data attribute (or shorthand `lazy`
attribute), which will delay update of element content until model is changed.
This is useful for rendering server-generated content, while keeping the UI
dynamic. In other frameworks, this technieque is known as
[hydration](<https://en.wikipedia.org/wiki/Hydration_(web_development)>).

### Parameters

---

#### `ng-bind`

- **Type:** [Expression](../../../typedoc/types/Expression.html)
- **Restrict:** `A`
- **Element:** ANY
- **Priority:** `0`
- **Description:** Expression to evaluate and modify
  [textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
  property.
- **Example:**

  ```html
  <div ng-bind="name"></div>
  ```

---

### Directive modifiers

#### `data-lazy`

- **Type:** N/A
- **Description:** Apply expression once the bound model changes.
- **Example:**

  ```html
  <div ng-bind="name" data-lazy></div>
  <!-- or -->
  <div ng-bind="name" lazy></div>
  ```

---

### Demo

{{< showhtml src="examples/ng-bind/ng-bind.html" >}}

{{< showraw src="examples/ng-bind/ng-bind.html" >}}

---
