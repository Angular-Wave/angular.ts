import { isError } from "../shared/utils";

///////////////////////////////////////////////////////////////////////////
// LogService
// see http://docs.angularjs.org/api/ng/service/$log
// see http://docs.angularjs.org/api/ng/provider/$logProvider
///////////////////////////////////////////////////////////////////////////

/**
 * @typedef {(...args: any[]) => void} LogCall
 */

/**
 * @typedef {Object} LogService
 * @property {LogCall} debug - Log a debug messages
 * @property {LogCall} error - Log a error message
 * @property {LogCall} info - Log a info message
 * @property {LogCall} log - Log a general message
 * @property {LogCall} warn - Log a warning message
 */

/**
 * @type {LogService}
 */
export let LogService = {
  debug: undefined,
  error: undefined,
  info: undefined,
  log: undefined,
  warn: undefined,
};

/**
 * @typedef {import('../types').ServiceProvider} LogProvider
 * @property {function(): boolean} debugEnabled - Function to get the current debug state.
 * @property {function(boolean): angular.LogProvider} debugEnabled - Function to enable or disable debug.
 */

/**
 * @type {LogProvider}
 * Use the `$logProvider` to configure how the application logs messages
 */
export class $LogProvider {
  constructor() {
    this.debug = true;
  }

  /**
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
      log: this.consoleLog("log"),
      info: this.consoleLog("info"),
      warn: this.consoleLog("warn"),
      error: this.consoleLog("error"),
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
