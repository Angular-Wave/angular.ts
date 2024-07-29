/\*\*

- A service that helps you run functions asynchronously, and use their return values (or exceptions)
- when they are done processing.
-
- This is a [Promises/A+](https://promisesaplus.com/)-compliant implementation of promises/deferred
- objects inspired by [Kris Kowal's Q](https://github.com/kriskowal/q).
-
- $q can be used in two fashions --- one which is more similar to Kris Kowal's Q or jQuery's Deferred
- implementations, and the other which resembles ES6 (ES2015) promises to some degree.
-
- ## $q constructor
-
- The streamlined ES6 style promise is essentially just using $q as a constructor which takes a `resolver`
- function as the first argument. This is similar to the native Promise implementation from ES6,
- see [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
-
- While the constructor-style use is supported, not all of the supporting methods from ES6 promises are
- available yet.
-
- It can be used like so:
-
- ```js

  ```

- // for the purpose of this example let's assume that variables `$q` and `okToGreet`
- // are available in the current lexical scope (they could have been injected or passed in).
-
- function asyncGreet(name) {
-     // perform some asynchronous operation, resolve or reject the promise when appropriate.
-     return $q(function(resolve, reject) {
-       setTimeout(function() {
-         if (okToGreet(name)) {
-           resolve('Hello, ' + name + '!');
-         } else {
-           reject('Greeting ' + name + ' is not allowed.');
-         }
-       }, 1000);
-     });
- }
-
- let promise = asyncGreet('Robin Hood');
- promise.then(function(greeting) {
-     alert('Success: ' + greeting);
- }, function(reason) {
-     alert('Failed: ' + reason);
- });
- ```

  ```

-
- Note: progress/notify callbacks are not currently supported via the ES6-style interface.
-
- Note: unlike ES6 behavior, an exception thrown in the constructor function will NOT implicitly reject the promise.
-
- However, the more traditional CommonJS-style usage is still available, and documented below.
-
- [The CommonJS Promise proposal](http://wiki.commonjs.org/wiki/Promises) describes a promise as an
- interface for interacting with an object that represents the result of an action that is
- performed asynchronously, and may or may not be finished at any given point in time.
-
- From the perspective of dealing with error handling, deferred and promise APIs are to
- asynchronous programming what `try`, `catch` and `throw` keywords are to synchronous programming.
-
- ```js

  ```

- // for the purpose of this example let's assume that variables `$q` and `okToGreet`
- // are available in the current lexical scope (they could have been injected or passed in).
-
- function asyncGreet(name) {
-     let deferred = $q.defer();
-
-     setTimeout(function() {
-       deferred.notify('About to greet ' + name + '.');
-
-       if (okToGreet(name)) {
-         deferred.resolve('Hello, ' + name + '!');
-       } else {
-         deferred.reject('Greeting ' + name + ' is not allowed.');
-       }
-     }, 1000);
-
-     return deferred.promise;
- }
-
- let promise = asyncGreet('Robin Hood');
- promise.then(function(greeting) {
-     alert('Success: ' + greeting);
- }, function(reason) {
-     alert('Failed: ' + reason);
- }, function(update) {
-     alert('Got notification: ' + update);
- });
- ```

  ```

-
- At first it might not be obvious why this extra complexity is worth the trouble. The payoff
- comes in the way of guarantees that promise and deferred APIs make, see
- https://github.com/kriskowal/uncommonjs/blob/master/promises/specification.md.
-
- Additionally the promise api allows for composition that is very hard to do with the
- traditional callback ([CPS](http://en.wikipedia.org/wiki/Continuation-passing_style)) approach.
- For more on this please see the [Q documentation](https://github.com/kriskowal/q) especially the
- section on serial or parallel joining of promises.
-
- ## The Deferred API
-
- A new instance of deferred is constructed by calling `$q.defer()`.
-
- The purpose of the deferred object is to expose the associated Promise instance as well as APIs
- that can be used for signaling the successful or unsuccessful completion, as well as the status
- of the task.
-
- **Methods**
-
- - `resolve(value)` – resolves the derived promise with the `value`. If the value is a rejection
- constructed via `$q.reject`, the promise will be rejected instead.
- - `reject(reason)` – rejects the derived promise with the `reason`. This is equivalent to
- resolving it with a rejection constructed via `$q.reject`.
- - `notify(value)` - provides updates on the status of the promise's execution. This may be called
- multiple times before the promise is either resolved or rejected.
-
- **Properties**
-
- - promise – `{Promise}` – promise object associated with this deferred.
-
-
- ## The Promise API
-
- A new promise instance is created when a deferred instance is created and can be retrieved by
- calling `deferred.promise`.
-
- The purpose of the promise object is to allow for interested parties to get access to the result
- of the deferred task when it completes.
-
- **Methods**
-
- - `then(successCallback, [errorCallback], [notifyCallback])` – regardless of when the promise was or
- will be resolved or rejected, `then` calls one of the success or error callbacks asynchronously
- as soon as the result is available. The callbacks are called with a single argument: the result
- or rejection reason. Additionally, the notify callback may be called zero or more times to
- provide a progress indication, before the promise is resolved or rejected.
-
- This method _returns a new promise_ which is resolved or rejected via the return value of the
- `successCallback`, `errorCallback` (unless that value is a promise, in which case it is resolved
- with the value which is resolved in that promise using
- [promise chaining](http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promises-queues)).
- It also notifies via the return value of the `notifyCallback` method. The promise cannot be
- resolved or rejected from the notifyCallback method. The errorCallback and notifyCallback
- arguments are optional.
-
- - `catch(errorCallback)` – shorthand for `promise.then(null, errorCallback)`
-
- - `finally(callback, notifyCallback)` – allows you to observe either the fulfillment or rejection of a promise,
- but to do so without modifying the final value. This is useful to release resources or do some
- clean-up that needs to be done whether the promise was rejected or resolved. See the [full
- specification](https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback) for
- more information.
-
- ## Chaining promises
-
- Because calling the `then` method of a promise returns a new derived promise, it is easily
- possible to create a chain of promises:
-
- ```js

  ```

- promiseB = promiseA.then(function(result) {
-     return result + 1;
- });
-
- // promiseB will be resolved immediately after promiseA is resolved and its value
- // will be the result of promiseA incremented by 1
- ```

  ```

-
- It is possible to create chains of any length and since a promise can be resolved with another
- promise (which will defer its resolution further), it is possible to pause/defer resolution of
- the promises at any point in the chain. This makes it possible to implement powerful APIs like
- $http's response interceptors.
-
-
- ## Differences between Kris Kowal's Q and $q
-
- There are two main differences:
-
- - $q is integrated with the {@link ng.$rootScope.Scope} Scope model observation
- mechanism in AngularJS, which means faster propagation of resolution or rejection into your
- models and avoiding unnecessary browser repaints, which would result in flickering UI.
- - Q has many more features than $q, but that comes at a cost of bytes. $q is tiny, but contains
- all the important functionality needed for common async tasks.
-
- ## Testing
-
- ```js

  ```

- it('should simulate promise', inject(function($q, $rootScope) {
-      let deferred = $q.defer();
-      let promise = deferred.promise;
-      let resolvedValue;
-
-      promise.then(function(value) { resolvedValue = value; });
-      expect(resolvedValue).toBeUndefined();
-
-      // Simulate resolving of promise
-      deferred.resolve(123);
-      // Note that the 'then' function does not get called synchronously.
-      // This is because we want the promise API to always be async, whether or not
-      // it got called synchronously or asynchronously.
-      expect(resolvedValue).toBeUndefined();
-
-      // Propagate promise resolution to 'then' functions using $apply().
-      $rootScope.$apply();
-      expect(resolvedValue).toEqual(123);
- }));
- ```
  */
  ```
