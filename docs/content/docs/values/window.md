---
title: $window
description: >
  Injectable `window` object
---

### Description

An injectable wrapper for `window`
[object ](https://developer.mozilla.org/en-US/docs/Web/API/Window). Useful for
mocking a browser dependency in non-browser environment tests:

**Example:**

```js
// value injectables are overriden
angular.module('demo', []).value('$window', {});
```

The wrapper also make accessible `window` directly in template scope via
`ng-inject` directive.

#### Demo

{{< showhtml src="examples/window/window.html" >}}

{{< showraw src="examples/window/window.html" >}}

---
