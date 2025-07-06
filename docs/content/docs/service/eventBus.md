---
title: $eventBus
description: >
    Pubsub messaging service
---

### Description

A messaging service, backed by an instance of [PubSub](../../../typedoc/classes/PubSub.html). This implementation is based on the original
[Google Closure PubSub](https://google.github.io/closure-library/api/goog.pubsub.PubSub.html) but uses 
[`Promise.resolve`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve) 
instead of [`Window.setTimeout()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) for its async implementation.
`$eventBus` allows communication between an Angular application instance and the outside context, which can be a non-Angular application, 
a third-party party library, or even WASM. Alternatively, `$eventBus` can be used to communicate with a template, 
using [`ng-channel`](../../../docs/directive/channel) directive.

The example below demonstrates communication between the global `window` context and a controller.

#### Example HTML
{{< showhtml src="examples/eventbus/eventbus.html" >}}

#### Example JS
{{< showjs src="examples/eventbus/eventbus.js" >}}


------

#### Result 
{{< showraw src="examples/eventbus/eventbus.html" >}}
<script>
{{< showraw src="examples/eventbus/eventbus.js" >}}
</script>

------

**Note**: Ensure topic clean-up after the `$scope` is destroyed 

```js
angular.module("demo", [])
    .contoller("Test", ($scope, $eventBus) => {
        const key = $eventBus.subscribe("channel", () => {});
        $scope.$on('$destroy', function() {
            $eventBus.unsubscribeByKey(key)
        });
    });
```

For detailed method description, see [PubSub](../../../typedoc/classes/PubSub.html)

------