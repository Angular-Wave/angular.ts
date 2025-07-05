---
title: $log
description: >
    Simple service for logging
---

Default implementation of [LogService](../../../typedoc/interfaces/LogService.html) safely writes the message into the browser's console (if present). The main purpose of this service is to simplify debugging and troubleshooting, while allowing the developer to modify the defaults for live environments.

To reveal the location of the calls to `$log` in the JavaScript console, you can "blackbox" the AngularTS source in your browser:

- [Mozilla description of blackboxing](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Black_box_a_source).
- [Chrome description of blackboxing](https://developer.chrome.com/devtools/docs/blackboxing).

> Note: Not all browsers support blackboxing.  
> The default is to log `debug` messages. You can use [`$logProvider.debug`](../../provider/logprovider/#logprovidersetlogger) to change this.


### Example
```js
angular.module('demo')
    .controller('MyController', ($log) => {
        $log.log('log');
        $log.info('info');
        $log.warn('warn!');
        $log.error('error');
        $log.debug('debug');
    });
```

For configuration, see [$logProvider](../../provider/logprovider)
