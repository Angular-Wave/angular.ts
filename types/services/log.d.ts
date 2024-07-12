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
export let LogService: angular.LogService;
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
    debug: boolean;
    /**
     * @name $logProvider#debugEnabled
     * @description
     * @param {boolean=} flag enable or disable debug level messages
     * @returns {*} current value if used as getter or itself (chaining) if used as setter
     */
    debugEnabled(flag?: boolean | undefined): any;
    formatError(arg: any): any;
    consoleLog(type: any): (...args: any[]) => any;
    $get(): angular.LogService;
}
/**
 * A function that accepts any number of arguments and returns void.
 */
export type LogCall = (...args: any[]) => void;
export namespace angular {
    type LogService = {
        /**
         * - Function to log debug messages.
         */
        debug: LogCall;
        /**
         * - Function to log error messages.
         */
        error: LogCall;
        /**
         * - Function to log info messages.
         */
        info: LogCall;
        /**
         * - Function to log general messages.
         */
        log: LogCall;
        /**
         * - Function to log warning messages.
         */
        warn: LogCall;
    };
    type LogProvider = any;
}
