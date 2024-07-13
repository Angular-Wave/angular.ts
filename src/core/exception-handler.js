/**
 * @name $exceptionHandler
 *
 * @description
 * Any uncaught exception in AngularJS expressions is delegated to this service.
 * The default implementation simply delegates to `$log.error` which logs it into
 * the browser console.
 *
 *
 * ## Example:
 *
 * The example below will overwrite the default `$exceptionHandler` in order to (a) log uncaught
 * errors to the backend for later inspection by the developers and (b) to use `$log.warn()` instead
 * of `$log.error()`.
 *
 * ```js
 *   angular.
 *     module('exceptionOverwrite', []).
 *     factory('$exceptionHandler', ['$log', 'logErrorsToBackend', function($log, logErrorsToBackend) {
 *       return function myExceptionHandler(exception, cause) {
 *         logErrorsToBackend(exception, cause);
 *         $log.warn(exception, cause);
 *       };
 *     }]);
 * ```
 *
 * <hr />
 * Note, that code executed in event-listeners (even those registered using JQLite's `on`/`bind`
 * methods) does not delegate exceptions to the {@link angular.ErrorHandler }
 * (unless executed during a digest).
 *
 * If you wish, you can manually delegate exceptions, e.g.
 * `try { ... } catch(e) { $exceptionHandler(e); }`
 *
 */

/**
 * @typedef {import('../index').angular.ServiceProvider} angular.ExceptionHandlerProvider
 */

/** @type {import('../services/log').angular.LogService} */
let log;

/**
 * @callback angular.ErrorHandler
 * @param {Error} exception - Exception associated with the error.
 * @param {string} [cause] - Optional information about the context in which the error was thrown.
 * @returns {void}
 */
export const errorHandler = (exception, cause) => {
  log.error(exception, cause);
};

/**
 * @constructor
 * @this {angular.ExceptionHandlerProvider}
 */
export function $ExceptionHandlerProvider() {
  this.$get = [
    "$log",
    /**
     * @param {import('../services/log').angular.LogService} $log
     * @returns {angular.ErrorHandler}
     */
    function ($log) {
      log = $log;
      return errorHandler;
    },
  ];
}
