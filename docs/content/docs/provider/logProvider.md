---
title: $logProvider
description: >
  Configuration provider for `$log` service.
---

### Description

Instance of [LogProvider](../../../typedoc/classes/LogProvider.html) for configuring how the application logs messages.

### Properties

------

#### $logProvider.debug

Enable or disable debug-level logging. Also see [debug property](../../../typedoc/classes/LogProvider.html#debug).

- **Type:** boolean  
- **Default:** `false`
- **Example:**

    ```js
    angular.module('demo', [])
      .config(($logProvider) => {
        $logProvider.debug = true;
      });
    ```


### Methods

------

#### $logProvider.setLogger()

Override the default logger with a custom implementation of the [LogService](../../../typedoc/interfaces/LogService.html) interface.

- **Parameter:** [LogServiceFactory](../../../typedoc/types/LogServiceFactory.html)

- **Example:**

    ```js
    angular.module("demo", [])
      .config(($logProvider) => {
        $logProvider.setLogger(() => ({
          log: () => (called = true),
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
        }));
      });
    ```

------

For service description, see [$log](../../../docs/service/log).
