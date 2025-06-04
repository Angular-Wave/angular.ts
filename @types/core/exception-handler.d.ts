/**
 * Handles uncaught exceptions thrown in AngularJS expressions.
 *
 * By default, this service delegates to `$log.error()`, logging the exception to the browser console.
 * You can override this behavior to provide custom exception handling—such as reporting errors
 * to a backend server, or altering the log level used.
 *
 * ## Default Behavior
 *
 * Uncaught exceptions within AngularJS expressions are intercepted and passed to this service.
 * The default implementation logs the error using `$log.error(exception, cause)`.
 *
 * ## Custom Implementation
 *
 * You can override the default `$exceptionHandler` by providing your own factory. This allows you to:
 * - Log errors to a remote server
 * - Change the log level (e.g., from `error` to `warn`)
 * - Trigger custom error-handling workflows
 *
 * ### Example: Overriding `$exceptionHandler`
 *
 * ```js
 * angular
 *   .module('exceptionOverwrite', [])
 *   .factory('$exceptionHandler', ['$log', 'logErrorsToBackend', function($log, logErrorsToBackend) {
 *     return function myExceptionHandler(exception, cause) {
 *       logErrorsToBackend(exception, cause);
 *       $log.warn(exception, cause); // Use warn instead of error
 *     };
 *   }]);
 * ```
 * - You may also manually invoke the exception handler:
 *
 * ```js
 * try {
 *   // Some code that might throw
 * } catch (e) {
 *   $exceptionHandler(e, 'optional context');
 * }
 * ```
 *
 * @see {@link angular.ErrorHandler AngularJS ErrorHandler}
 */
/** @typedef {import('../services/log').LogService} LogService */
/**
 * @callback ErrorHandler
 * @param {Error} exception - Exception associated with the error.
 * @param {string} [cause] - Optional information about the context in which the error was thrown.
 * @returns {void}
 */
/**
 * Provider for `$exceptionHandler` service. Delegates uncaught exceptions to `$log.error()` by default.
 * Can be overridden to implement custom error-handling logic.
 */
export class ExceptionHandlerProvider {
    /** @type {LogService} */
    log: LogService;
    /** @type {ErrorHandler} */
    errorHandler: ErrorHandler;
    $get: (string | (($log: LogService) => ErrorHandler))[];
}
export type LogService = any;
export type ErrorHandler = (exception: Error, cause?: string) => void;
