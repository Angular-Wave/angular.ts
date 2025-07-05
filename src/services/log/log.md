# $log

Simple service for logging. Default implementation safely writes the message into the browser's console (if present).

The main purpose of this service is to simplify debugging and troubleshooting.

To reveal the location of the calls to `$log` in the JavaScript console, you can "blackbox" the AngularTS source in your browser:

- [Mozilla description of blackboxing](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Black_box_a_source).
- [Chrome description of blackboxing](https://developer.chrome.com/devtools/docs/blackboxing).

Note: Not all browsers support blackboxing.

The default is to log `debug` messages. You can use [`ng.$logProvider.debug`](https://docs.angularjs.org/api/ng/provider/$logProvider#debugEnabled) to change this.

## Example

```html
<example module="logExample" name="log-service">
  <file name="script.js">
    angular.module('logExample', []) .controller('LogController', ['$scope',
    '$log', function($scope, $log) { $scope.$log = $log; $scope.message = 'Hello
    World!'; }]);
  </file>
  <file name="index.html">
    <div ng-controller="LogController">
      <p>
        Reload this page with open console, enter text and hit the log button...
      </p>
      <label>Message: <input type="text" ng-model="message" /></label>
      <button ng-click="$log.log(message)">log</button>
      <button ng-click="$log.warn(message)">warn</button>
      <button ng-click="$log.info(message)">info</button>
      <button ng-click="$log.error(message)">error</button>
      <button ng-click="$log.debug(message)">debug</button>
    </div>
  </file>
</example>
```
