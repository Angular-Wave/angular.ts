/**
 * Use the `$logProvider` to configure how the application logs messages
 */
export class LogProvider {
  /** @type {boolean} */
  debug: boolean;
  /** @private @type {import("./interface.ts").LogServiceFactory | null} */
  private _override;
  /**
   * Override the default
   * @param {import("./interface.ts").LogServiceFactory} fn
   */
  setLogger(fn: import("./interface.ts").LogServiceFactory): void;
  formatError(arg: any): any;
  consoleLog(type: any): (...args: any[]) => any;
  /**
   * @returns {import("./interface.ts").LogService}
   */
  $get(): import("./interface.ts").LogService;
}
