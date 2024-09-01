import {
  forEach,
  minErr,
  isUndefined,
  isFunction,
  isObject,
  isDefined,
  isError,
  toDebugString,
  isPromiseLike,
} from "../../shared/utils";

/**
 * @template T
 * @typedef {Object} QPromise
 * @property {function(
 *   ((value: T) => (PromiseLike<never>|PromiseLike<T>|T))|null,
 *   ((reason: any) => (PromiseLike<never>|PromiseLike<T>|T))|null,
 *   ((state: any) => any)=
 * ): QPromise<T|never>} then - Calls one of the success or error callbacks asynchronously as soon as the result is available.
 * @property {function(
 *   ((value: T) => (QPromise<never>|QPromise<T>|T))|null,
 *   ((reason: any) => (QPromise<never>|QPromise<never>|never))|null,
 *   ((state: any) => any)
 * ): QPromise<T|never>} then - Calls one of the success or error callbacks asynchronously as soon as the result is available.
 * @property {function(((reason: any) => (PromiseLike<never>|PromiseLike<T>|T))|null): QPromise<T>|T} catch - Shorthand for promise.then(null, errorCallback).
 * @property {function(((reason: any) => (QPromise<never>|QPromise<T>|T))|null): QPromise<T>|T} catch - Shorthand for promise.then(null, errorCallback).
 * @property {function(Array.<QPromise<T>>): QPromise<T>} all
 * @property {function(function(): void): QPromise<T>} finally - Allows you to observe either the fulfillment or rejection of a promise, but to do so without modifying the final value.
 * @property {number} [$$intervalId] - Internal id set by the $interval service for callback notifications
 * @property {number} [$$timeoutId] - Timeout id set by the $timeout service for cancelations
 */

/**
 *@template T
 * @typedef {Object} Deferred
 * @property {function(T|QPromise<T>): void} resolve - Resolves the promise with a value or another promise.
 * @property {function(any): void} reject - Rejects the promise with a reason.
 * @property {function(any): void} notify - Provides a progress notification.
 * @property {QPromise<T>} promise - The promise associated with this deferred object.
 */

export function $QProvider() {
  let errorOnUnhandledRejections = true;
  this.$get = [
    "$rootScope",
    "$exceptionHandler",
    /**
     *
     * @param {import('../scope/scope').Scope} $rootScope
     * @param {import('../exception-handler').ErrorHandler} $exceptionHandler
     * @returns
     */
    function ($rootScope, $exceptionHandler) {
      return qFactory(
        (callback) => {
          $rootScope.$evalAsync(
            /** @type {function(function):any} */ (callback),
          );
        },
        $exceptionHandler,
        errorOnUnhandledRejections,
      );
    },
  ];

  /**
   * Retrieves or overrides whether to generate an error when a rejected promise is not handled.
   * This feature is enabled by default.
   *
   * @param {boolean=} value Whether to generate an error when a rejected promise is not handled.
   * @returns {boolean|$QProvider} Current value when called without a new value or self for
   *    chaining otherwise.
   */
  this.errorOnUnhandledRejections = function (value) {
    if (isDefined(value)) {
      errorOnUnhandledRejections = value;
      return this;
    }
    return errorOnUnhandledRejections;
  };
}

export function $$QProvider() {
  let errorOnUnhandledRejections = true;
  this.$get = [
    "$browser",
    "$exceptionHandler",
    function ($browser, $exceptionHandler) {
      return qFactory(
        (callback) => {
          $browser.defer(callback);
        },
        $exceptionHandler,
        errorOnUnhandledRejections,
      );
    },
  ];

  this.errorOnUnhandledRejections = function (value) {
    if (isDefined(value)) {
      errorOnUnhandledRejections = value;
      return this;
    }
    return errorOnUnhandledRejections;
  };
}

/**
 * Constructs a promise manager.
 *
 * @param {function(function):any} nextTick Function for executing functions in the next turn.
 * @param {function(...any):any} exceptionHandler Function into which unexpected exceptions are passed for
 *     debugging purposes.
 * @param {boolean=} errorOnUnhandledRejections Whether an error should be generated on unhandled
 *     promises rejections.
 * @returns {object} Promise manager.
 */
function qFactory(nextTick, exceptionHandler, errorOnUnhandledRejections) {
  const $qMinErr = minErr("$q");
  let queueSize = 0;
  const checkQueue = [];

  /**
   * Creates a `Deferred` object which represents a task which will finish in the future.
   *
   * @returns {Deferred} Returns a new instance of deferred.
   */
  function defer() {
    return new Deferred();
  }

  class Deferred {
    constructor() {
      this.promise = new QPromise();
      this.resolve = (val) => resolvePromise(this.promise, val);
      this.reject = (reason) => rejectPromise(this.promise, reason);
      this.notify = (progress) => notifyPromise(this.promise, progress);
    }
  }

  class QPromise {
    constructor() {
      this.$$state = { status: 0 };
    }

    then(onFulfilled, onRejected, progressBack) {
      if (
        isUndefined(onFulfilled) &&
        isUndefined(onRejected) &&
        isUndefined(progressBack)
      ) {
        return this;
      }
      const result = new QPromise();

      this.$$state.pending = this.$$state.pending || [];
      this.$$state.pending.push([
        result,
        onFulfilled,
        onRejected,
        progressBack,
      ]);
      if (this.$$state.status > 0) scheduleProcessQueue(this.$$state);

      return result;
    }

    catch(callback) {
      return this.then(null, callback);
    }

    finally(callback, progressBack) {
      return this.then(
        (value) => handleCallback(value, resolve, callback),
        (error) => handleCallback(error, reject, callback),
        progressBack,
      );
    }
  }

  function processQueue(state) {
    let fn;
    let promise;
    let pending;

    pending = state.pending;
    state.processScheduled = false;
    state.pending = undefined;
    try {
      for (let i = 0, ii = pending.length; i < ii; ++i) {
        markQStateExceptionHandled(state);
        promise = pending[i][0];
        fn = pending[i][state.status];
        try {
          if (isFunction(fn)) {
            resolvePromise(promise, fn(state.value));
          } else if (state.status === 1) {
            resolvePromise(promise, state.value);
          } else {
            rejectPromise(promise, state.value);
          }
        } catch (e) {
          rejectPromise(promise, e);
          // This error is explicitly marked for being passed to the $exceptionHandler
          if (e && e.$$passToExceptionHandler === true) {
            exceptionHandler(e);
          }
        }
      }
    } finally {
      --queueSize;
      if (errorOnUnhandledRejections && queueSize === 0) {
        nextTick(processChecks);
      }
    }
  }

  function processChecks() {
    while (!queueSize && checkQueue.length) {
      const toCheck = checkQueue.shift();
      if (!isStateExceptionHandled(toCheck)) {
        markQStateExceptionHandled(toCheck);
        const errorMessage = `Possibly unhandled rejection: ${toDebugString(toCheck.value)}`;
        if (isError(toCheck.value)) {
          exceptionHandler(toCheck.value, errorMessage);
        } else {
          exceptionHandler(errorMessage);
        }
      }
    }
  }

  function scheduleProcessQueue(state) {
    if (
      errorOnUnhandledRejections &&
      !state.pending &&
      state.status === 2 &&
      !isStateExceptionHandled(state)
    ) {
      if (queueSize === 0 && checkQueue.length === 0) {
        nextTick(processChecks);
      }
      checkQueue.push(state);
    }
    if (state.processScheduled || !state.pending) return;
    state.processScheduled = true;
    ++queueSize;
    nextTick(() => {
      processQueue(state);
    });
  }

  function resolvePromise(promise, val) {
    if (promise.$$state.status) return;
    if (val === promise) {
      $$reject(
        promise,
        $qMinErr(
          "qcycle",
          "Expected promise to be resolved with value other than itself '{0}'",
          val,
        ),
      );
    } else {
      $$resolve(promise, val);
    }
  }

  function $$resolve(promise, val) {
    let then;
    let done = false;
    try {
      if (isObject(val) || isFunction(val)) then = val.then;
      if (isFunction(then)) {
        promise.$$state.status = -1;
        then.call(val, doResolve, doReject, doNotify);
      } else {
        promise.$$state.value = val;
        promise.$$state.status = 1;
        scheduleProcessQueue(promise.$$state);
      }
    } catch (e) {
      doReject(e);
    }

    function doResolve(val) {
      if (done) return;
      done = true;
      $$resolve(promise, val);
    }
    function doReject(val) {
      if (done) return;
      done = true;
      $$reject(promise, val);
    }
    function doNotify(progress) {
      notifyPromise(promise, progress);
    }
  }

  function rejectPromise(promise, reason) {
    if (promise.$$state.status) return;
    $$reject(promise, reason);
  }

  function $$reject(promise, reason) {
    promise.$$state.value = reason;
    promise.$$state.status = 2;
    scheduleProcessQueue(promise.$$state);
  }

  function notifyPromise(promise, progress) {
    const callbacks = promise.$$state.pending;

    if (promise.$$state.status <= 0 && callbacks && callbacks.length) {
      nextTick(() => {
        let callback;
        let result;
        for (let i = 0, ii = callbacks.length; i < ii; i++) {
          result = callbacks[i][0];
          callback = callbacks[i][3];
          try {
            notifyPromise(
              result,
              isFunction(callback) ? callback(progress) : progress,
            );
          } catch (e) {
            exceptionHandler(e);
          }
        }
      });
    }
  }

  /**
   * Creates a promise that is resolved as rejected with the specified `reason`. This api should be
   * used to forward rejection in a chain of promises. If you are dealing with the last promise in
   * a promise chain, you don't need to worry about it.
   *
   * When comparing deferreds/promises to the familiar behavior of try/catch/throw, think of
   * `reject` as the `throw` keyword in JavaScript. This also means that if you "catch" an error via
   * a promise error callback and you want to forward the error to the promise derived from the
   * current promise, you have to "rethrow" the error by returning a rejection constructed via
   * `reject`.
   *
   * ```js
   *   promiseB = promiseA.then(function(result) {
   *     // success: do something and resolve promiseB
   *     //          with the old or a new result
   *     return result;
   *   }, function(reason) {
   *     // error: handle the error if possible and
   *     //        resolve promiseB with newPromiseOrValue,
   *     //        otherwise forward the rejection to promiseB
   *     if (canHandle(reason)) {
   *      // handle the error and recover
   *      return newPromiseOrValue;
   *     }
   *     return $q.reject(reason);
   *   });
   * ```
   *
   * @param {*} reason Constant, message, exception or an object representing the rejection reason.
   * @returns {QPromise} Returns a promise that was already resolved as rejected with the `reason`.
   */
  function reject(reason) {
    const result = new QPromise();
    rejectPromise(result, reason);
    return result;
  }

  function handleCallback(value, resolver, callback) {
    let callbackOutput = null;
    try {
      if (isFunction(callback)) callbackOutput = callback();
    } catch (e) {
      return reject(e);
    }
    if (isPromiseLike(callbackOutput)) {
      return callbackOutput.then(() => resolver(value), reject);
    }
    return resolver(value);
  }

  /**
   * Wraps an object that might be a value or a (3rd party) then-able promise into a $q promise.
   * This is useful when you are dealing with an object that might or might not be a promise, or if
   * the promise comes from a source that can't be trusted.
   *
   * @param {*} value Value or a promise
   * @param {Function=} successCallback
   * @param {Function=} errorCallback
   * @param {Function=} progressCallback
   * @returns {QPromise} Returns a promise of the passed value or promise
   */

  function resolve(value, successCallback, errorCallback, progressCallback) {
    const result = new QPromise();
    resolvePromise(result, value);
    return result.then(successCallback, errorCallback, progressCallback);
  }

  /**
   * Combines multiple promises into a single promise that is resolved when all of the input
   * promises are resolved.
   *
   * @param {Array.<QPromise>} promises An array or hash of promises.
   * @returns {QPromise} Returns a single promise that will be resolved with an array/hash of values,
   *   each value corresponding to the promise at the same index/key in the `promises` array/hash.
   *   If any of the promises is resolved with a rejection, this resulting promise will be rejected
   *   with the same rejection value.
   */

  function all(promises) {
    const result = new QPromise();
    let counter = 0;
    const results = Array.isArray(promises) ? [] : {};

    forEach(promises, (promise, key) => {
      counter++;
      resolve(promise).then(
        (value) => {
          results[key] = value;
          if (!--counter) resolvePromise(result, results);
        },
        (reason) => {
          rejectPromise(result, reason);
        },
      );
    });

    if (counter === 0) {
      resolvePromise(result, results);
    }

    return result;
  }

  /**
   * Returns a promise that resolves or rejects as soon as one of those promises
   * resolves or rejects, with the value or reason from that promise.
   *
   * @param {Array.<QPromise>} promises An array or hash of promises.
   * @returns {QPromise} a promise that resolves or rejects as soon as one of the `promises`
   * resolves or rejects, with the value or reason from that promise.
   */

  function race(promises) {
    const deferred = defer();

    forEach(promises, (promise) => {
      resolve(promise).then(deferred.resolve, deferred.reject);
    });

    return deferred.promise;
  }

  /**
   * @param {function(function, function):any} resolver Function which is responsible for resolving or
   *   rejecting the newly created promise. The first parameter is a function which resolves the
   *   promise, the second parameter is a function which rejects the promise.
   *
   * @returns {QPromise} The newly created promise.
   */
  function $Q(resolver) {
    if (!isFunction(resolver)) {
      throw $qMinErr("norslvr", "Expected resolverFn, got '{0}'", resolver);
    }

    const promise = new QPromise();

    function resolveFn(value) {
      resolvePromise(promise, value);
    }

    function rejectFn(reason) {
      rejectPromise(promise, reason);
    }

    resolver(resolveFn, rejectFn);

    return promise;
  }

  // Let's make the instanceof operator work for promises, so that
  // `new $q(fn) instanceof $q` would evaluate to true.
  $Q.prototype = QPromise.prototype;

  $Q.defer = defer;
  $Q.reject = reject;
  $Q.resolve = resolve;
  $Q.all = all;
  $Q.race = race;

  return $Q;
}

function isStateExceptionHandled(state) {
  return !!state.pur;
}
function markQStateExceptionHandled(state) {
  state.pur = true;
}
export function markQExceptionHandled(q) {
  // Built-in `$q` promises will always have a `$$state` property. This check is to allow
  // overwriting `$q` with a different promise library (e.g. Bluebird + angular-bluebird-promises).
  // (Currently, this is the only method that might be called with a promise, even if it is not
  // created by the built-in `$q`.)
  if (q.$$state) {
    markQStateExceptionHandled(q.$$state);
  }
}
