export type LogService = {
    /**
     * - Log a debug messages
     */
    debug: LogCall;
    /**
     * - Log a error message
     */
    error: LogCall;
    /**
     * - Log a info message
     */
    info: LogCall;
    /**
     * - Log a general message
     */
    log: LogCall;
    /**
     * - Log a warning message
     */
    warn: LogCall;
};
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
export let LogService: LogService;
/**
 * @typedef {import('../types').ServiceProvider} LogProvider
 * @property {function(): boolean} debugEnabled - Function to get the current debug state.
 * @property {function(boolean): angular.LogProvider} debugEnabled - Function to enable or disable debug.
 */
/**
 * @type {LogProvider}
 * Use the `$logProvider` to configure how the application logs messages
 */
export class LogProvider {
    debug: any;
    /**
     * @param {boolean=} flag enable or disable debug level messages
     * @returns {*} current value if used as getter or itself (chaining) if used as setter
     */
    debugEnabled(flag?: boolean | undefined): any;
    formatError(arg: any): any;
    consoleLog(type: any): (...args: any[]) => any;
    $get(): LogService;
}
export type LogCall = (...args: any[]) => void;
