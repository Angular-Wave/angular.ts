import { isError } from "../shared/utils";

///////////////////////////////////////////////////////////////////////////
// LogService
// see http://docs.angularjs.org/api/ng/service/$log
// see http://docs.angularjs.org/api/ng/provider/$logProvider
///////////////////////////////////////////////////////////////////////////

/**
 * @typedef {(...args: any[]) => void} LogCall
 * A function that accepts any number of arguments and returns void.
 */

/**
 * @typedef {Object} angular.LogService
 * @property {LogCall} debug - Function to log debug messages.
 * @property {LogCall} error - Function to log error messages.
 * @property {LogCall} info - Function to log info messages.
 * @property {LogCall} log - Function to log general messages.
 * @property {LogCall} warn - Function to log warning messages.
 */

/**
 * @type {angular.LogService}
 */
export let LogService = {
  debug: undefined,
  error: undefined,
  info: undefined,
  log: undefined,
  warn: undefined,
} 

/**
 * @typedef {import('../index').ServiceProvider} angular.LogProvider
 * @property {function(): boolean} debugEnabled - Function to get the current debug state.
 * @property {function(boolean): angular.LogProvider} debugEnabled - Function to enable or disable debug.
 */

/**
 * @name $logProvider
 * @type {angular.LogProvider}
 *
 * @description
 * Use the `$logProvider` to configure how the application logs messages
 */
export class $LogProvider {
  constructor() {
    this.debug = true;
  }

  /**
   * @name $logProvider#debugEnabled
   * @description
   * @param {boolean=} flag enable or disable debug level messages
   * @returns {*} current value if used as getter or itself (chaining) if used as setter
   */
  debugEnabled(flag) {
    if (typeof flag !== "undefined") {
      this.debug = flag;
      return this;
    }
    return this.debug;
  }

  formatError(arg) {
    if (isError(arg)) {
      if (arg.stack) {
        arg =
          arg.message && arg.stack.indexOf(arg.message) === -1
            ? `Error: ${arg.message}\n${arg.stack}`
            : arg.stack;
      } else if (arg.sourceURL) {
        arg = `${arg.message}\n${arg.sourceURL}:${arg.line}`;
      }
    }
    return arg;
  }

  consoleLog(type) {
    const console = window.console || {};
    const logFn = console[type] || console.log || (() => {});

    return (...args) => {
      const formattedArgs = args.map((arg) => this.formatError(arg));
    return logFn.apply(console, formattedArgs);
    };
  }

  $get() {
    LogService = {
      /**
       * @ngdoc method
       * @name $log#log
       *
       * @description
       * Write a log message
       */
      log: this.consoleLog("log"),

      /**
       * @ngdoc method
       * @name $log#info
       *
       * @description
       * Write an information message
       */
      info: this.consoleLog("info"),

      /**
       * @ngdoc method
       * @name $log#warn
       *
       * @description
       * Write a warning message
       */
      warn: this.consoleLog("warn"),

      /**
       * @ngdoc method
       * @name $log#error
       *
       * @description
       * Write an error message
       */
      error: this.consoleLog("error"),

      /**
       * @ngdoc method
       * @name $log#debug
       *
       * @description
       * Write a debug message
       */
      debug: (() => {
        const fn = this.consoleLog("debug");
        return (...args) => {
          if (this.debug) {
            fn.apply(this, args);
          }
        };
      })(),
    };
    return LogService;
  }
}
