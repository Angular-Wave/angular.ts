/**
 * Handles uncaught exceptions thrown in AngularTS expressions.
 *
 * By default, this service delegates to `$log.error()`, logging the exception to the browser console.
 * You can override this behavior to provide custom exception handling—such as reporting errors
 * to a backend server, or altering the log level used.
 *
 * ## Default Behavior
 *
 * Uncaught exceptions within AngularTS expressions are intercepted and passed to this service.
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
 * @see {@link angular.ErrorHandler AngularTS ErrorHandler}
 */
/** @typedef {import('../services/log/interface.ts').LogService} LogService */
/** @typedef {import("./error-handler.ts").ErrorHandler}  ErrorHandler */
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
export type LogService = import("../services/log/interface.ts").LogService;
export type ErrorHandler = import("./error-handler.ts").ErrorHandler;
