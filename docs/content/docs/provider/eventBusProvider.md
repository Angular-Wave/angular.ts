---
title: $eventBusProvider
description: >
  Configuration provider for `$eventBus` service.
---

### Description

Instance of [PubSubProvider](../../../typedoc/classes/PubSubProvider.html) for configuring the `$eventBus` service.
The default implementation returns the global `angular.EventBus` instance, which is an async instance of 
[PubSub](../../../typedoc/classes/PubSub.html) class.

### Properties

------

#### $eventBusProvider.eventBus

Customize event bus instance.

- **Type:** [PubSub](../../../typedoc/classes/PubSub.html)  
- **Default:** `angular.EventBus`

- **Example:**

    ```js
    angular.module('demo', [])
      .config(($eventBusProvider) => {
        eventBusProvider.eventBus = new MyCustomPubsub();
      });
    ```