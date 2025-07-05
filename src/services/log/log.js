import { isError } from "../../shared/utils.js";

/**
 * Use the `$logProvider` to configure how the application logs messages
 */
export class LogProvider {
  constructor() {
    /** @type {boolean} */
    this.debug = false;
    /** @type {import("./interface.ts").LoggerServiceFactory | null} */
    this._override = null;
  }

  /**
   * Override the default
   * @param {import("./interface.ts").LoggerServiceFactory} fn
   */
  setLogger(fn) {
    this._override = fn;
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
    if (this._override) {
      return this._override();
    }
    return {
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
  }
}
