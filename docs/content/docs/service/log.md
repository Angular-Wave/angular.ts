---
title: $log
description: >
  A simple service for logging
---

### Using `$log`

Default implementation of
[LogService](../../../typedoc/interfaces/LogService.html) safely writes the
message into the browser's
[console](https://developer.mozilla.org/en-US/docs/Web/API/console) (if
present). The main purpose of this service is to simplify debugging and
troubleshooting, while allowing the developer to modify the defaults for live
environments.

##### **Example\***

```js
angular.module('demo').controller('MyController', ($log) => {
  $log.log('log');
  $log.info('info');
  $log.warn('warn!');
  $log.error('error');
  $log.debug('debug');
});
```

To reveal the location of the calls to `$log` in the JavaScript console, you can
"blackbox" the AngularTS source in your browser:

- [Mozilla description of blackboxing](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Black_box_a_source).
- [Chrome description of blackboxing](https://developer.chrome.com/devtools/docs/blackboxing).

> Note: Not all browsers support blackboxing.  
> The default is to log `debug` messages. You can use
> [`$logProvider.debug`](../../../docs/provider/logprovider/#logprovidersetlogger)
> to change this.

For configuration and custom implementations, see
[$logProvider](../../../docs/provider/logprovider).

### Decorating `$log`

You can also optionally override any of the `$log` service methods with
`$provide` decorator. Below is a simple example that overrides default
`$log.error` to log errors to both console and a backend endpoint.

##### **Example\***

```js
angular.module('demo').config(($provide) => {
  $provide.decorator('$log', ($delegate, $http, $exceptionHandler) => {
    const originalError = $delegate.error;
    $delegate.error = () => {
      originalError.apply($delegate, arguments);
      const errorMessage = Array.prototype.slice.call(arguments).join(' ');
      $http.post('/api/log/error', { message: errorMessage });
    };
    return $delegate;
  });
});
```

### Overriding `console`

If your application is already heavily reliant on default
[console](https://developer.mozilla.org/en-US/docs/Web/API/console) logging or
you are using a third-party library where logging cannot be overriden, you can
still take advantage of Angular's services by modifying the globals at runtime.
Below is an example that overrides default `console.error` to logs errors to
both console and a backend endpoint.

##### **Example\***

```js
angular.module('demo').run(($http) => {
  /**
   * Decorate console.error to log error messages to the server.
   */
  const $delegate = window.console.error;
  window.console.error = (...args) => {
    try {
      const errorMessage = args
        .map((arg) => (arg instanceof Error ? arg.stack : JSON.stringify(arg)))
        .join(' ');
      $delegate.apply(console, args);
      $http.post('/api/log/error', { message: errorMessage });
    } catch (e) {
      console.warn(e);
    }
  };

  /**
   * Detect errors thrown outside Angular and report them to the server.
   */
  window.addEventListener('error', (e) => {
    window.console.error(e.error || e.message, e);
  });

  /**
   * Optionally: Capture unhandled promise rejections
   */
  window.addEventListener('unhandledrejection', (e) => {
    window.console.error(e.reason || e);
  });
});
```

Combining both `$log` decoration and `console.log` overriding provides a robust
and flexible error reporting strategy that can adapt to your use-case.

\* array notation and HTTP error handling omitted for brevity
