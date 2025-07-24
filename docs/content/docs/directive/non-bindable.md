---
title: ng-non-bindable
description: >
  Stops compilation for element
---

### Description

The `ng-non-bindable` directive tells the framework not to compile or bind the
contents of the current DOM element, including directives on the element itself
that have a lower priority than `ngNonBindable`. This is useful if the element
contains what appears to be directives and bindings but which should be ignored.
This could be the case if you have a site that displays snippets of code, for
instance.

#### `ng-non-bindable`

- **Type:** N/A
- **Description:** Stops compilation process for element
- **Priority:** 1000
- **Element:** ANY
- **Example:**

  {{< showhtml src="examples/ng-non-bindable/ng-non-bindable.html" >}}

  ***

  {{< showraw src="examples/ng-non-bindable/ng-non-bindable.html" >}}
