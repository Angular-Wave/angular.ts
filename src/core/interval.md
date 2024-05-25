/**
_ @ngdoc service
_ @name $interval
       *
       * @description
       * AngularJS's wrapper for `window.setInterval`. The `fn` function is executed every `delay`
       * milliseconds.
       *
       * The return value of registering an interval function is a promise. This promise will be
       * notified upon each tick of the interval, and will be resolved after `count` iterations, or
       * run indefinitely if `count` is not defined. The value of the notification will be the
       * number of iterations that have run.
       * To cancel an interval, call `$interval.cancel(promise)`.
       *
       * In tests you can use {@link ngMock.$interval#flush `$interval.flush(millis)`} to
       * move forward by `millis` milliseconds and trigger any functions scheduled to run in that
_ time.
_
_ <div class="alert alert-warning">
_ **Note\*_: Intervals created by this service must be explicitly destroyed when you are finished
_ with them. In particular they are not automatically destroyed when a controller's scope or a
_ directive's element are destroyed.
_ You should take this into consideration and make sure to always cancel the interval at the
_ appropriate moment. See the example below for more details on how and when to do this.
_ </div> \*
_ @param {function()} fn A function that should be called repeatedly. If no additional arguments
_ are passed (see below), the function is called with the current iteration count.
_ @param {number} delay Number of milliseconds between each function call.
_ @param {number=} [count=0] Number of times to repeat. If not set, or 0, will repeat
_ indefinitely.
_ @param {boolean=} [invokeApply=true] If set to `false` skips model dirty checking, otherwise
_ will invoke `fn` within the {@link ng.$rootScope.Scope#$apply $apply} block.
_ @param {..._=} Pass additional parameters to the executed function.
_ @returns {promise} A promise which will be notified on each iteration. It will resolve once all iterations of the interval complete. \*
_ @example
_ <example module="intervalExample" name="interval-service">
_ <file name="index.html">
_ <script>
_ angular.module('intervalExample', [])
_ .controller('ExampleController', ['$scope', '$interval',
* function($scope, $interval) {
* $scope.format = 'M/d/yy h:mm:ss a';
* $scope.blood_1 = 100;
* $scope.blood_2 = 120;
*
* let stop;
* $scope.fight = function() {
* // Don't start a new fight if we are already fighting
* if ( angular.isDefined(stop) ) return;
*
* stop = $interval(function() {
* if ($scope.blood_1 > 0 && $scope.blood_2 > 0) {
* $scope.blood_1 = $scope.blood_1 - 3;
* $scope.blood_2 = $scope.blood_2 - 4;
* } else {
* $scope.stopFight();
* }
* }, 100);
* };
*
* $scope.stopFight = function() {
* if (angular.isDefined(stop)) {
* $interval.cancel(stop);
* stop = undefined;
* }
* };
*
* $scope.resetFight = function() {
* $scope.blood_1 = 100;
* $scope.blood_2 = 120;
* };
*
* $scope.$on('$destroy', function() {
* // Make sure that the interval is destroyed too
* $scope.stopFight();
* });
* }])
_ // Register the 'myCurrentTime' directive factory method.
_ // We inject $interval and dateFilter service since the factory method is DI.
       *       .directive('myCurrentTime', ['$interval', 'dateFilter',
_ function($interval, dateFilter) {
_ // return the directive link function. (compile function not needed)
_ return function(scope, element, attrs) {
_ let format, // date format
_ stopTime; // so that we can cancel the time updates
_
_ // used to update the UI
_ function updateTime() {
_ element.text(dateFilter(new Date(), format));
_ } \*
_ // watch the expression, and update the UI on change.
_ scope.$watch(attrs.myCurrentTime, function(value) {
       *               format = value;
       *               updateTime();
       *             });
       *
       *             stopTime = $interval(updateTime, 1000);
       *
       *             // listen on DOM destroy (removal) event, and cancel the next UI update
       *             // to prevent updating time after the DOM element was removed.
       *             element.on('$destroy', function() {
_ $interval.cancel(stopTime);
_ });
_ }
_ }]);
_ </script>
_
_ <div>
_ <div ng-controller="ExampleController">
_ <label>Date format: <input ng-model="format"></label> <hr/>
_ Current time is: <span my-current-time="format"></span>
_ <hr/>
_ Blood 1 : <font color='red'>{{blood_1}}</font>
_ Blood 2 : <font color='red'>{{blood_2}}</font>
_ <button type="button" data-ng-click="fight()">Fight</button>
_ <button type="button" data-ng-click="stopFight()">StopFight</button>
_ <button type="button" data-ng-click="resetFight()">resetFight</button>
_ </div>
_ </div> \*
_ </file>
_ </example>
\*/
