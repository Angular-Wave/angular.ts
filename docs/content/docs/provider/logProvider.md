---
title: $logProvider
description: >
  Configuration provider for `$log` service.
---

Instance of [LogProvider](../../../typedoc/classes/LogProvider.html) for configuring how the application logs messages.

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

For the logging service, see [$log](../../../docs/service/log).
