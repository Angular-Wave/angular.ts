/**
 * Use the `$logProvider` to configure how the application logs messages
 */
export class LogProvider {
  /** @type {boolean} */
  debug: boolean;
  /** @type {import("./interface.ts").LoggerServiceFactory | null} */
  _override: import("./interface.ts").LoggerServiceFactory | null;
  /**
   * Override the default
   * @param {import("./interface.ts").LoggerServiceFactory} fn
   */
  setLogger(fn: import("./interface.ts").LoggerServiceFactory): void;
  formatError(arg: any): any;
  consoleLog(type: any): (...args: any[]) => any;
  $get(): {
    log: (...args: any[]) => any;
    info: (...args: any[]) => any;
    warn: (...args: any[]) => any;
    error: (...args: any[]) => any;
    debug: (...args: any[]) => void;
  };
}
