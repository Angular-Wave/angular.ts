---
title: $document
description: >
  Injectable `window.document` object
---

### Description

An injectable wrapper for `window.document`
[object ](https://developer.mozilla.org/en-US/docs/Web/API/Document). Useful for
mocking a browser dependency in non-browser environment tests:

**Example:**

```js
// value injectables are overriden
angular.module('demo', []).value('$document', {});
```

The wrapper also make accessible `window.document` directly in template scope
via `ng-inject` directive.

#### Demo

{{< showhtml src="examples/document/document.html" >}}

{{< showraw src="examples/document/document.html" >}}

---
