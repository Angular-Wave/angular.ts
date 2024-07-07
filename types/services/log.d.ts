/**
 * @ngdoc provider
 * @name $logProvider
 * @type {ng.ILogProvider}
 *
 * @description
 * Use the `$logProvider` to configure how the application logs messages
 */
export class $LogProvider {
    debug: boolean;
    /**
     * @ngdoc method
     * @name $logProvider#debugEnabled
     * @description
     * @param {boolean=} flag enable or disable debug level messages
     * @returns {*} current value if used as getter or itself (chaining) if used as setter
     */
    debugEnabled(flag?: boolean | undefined): any;
    formatError(arg: any): any;
    consoleLog(type: any): (...args: any[]) => any;
    $get(): {
        /**
         * @ngdoc method
         * @name $log#log
         *
         * @description
         * Write a log message
         */
        log: (...args: any[]) => any;
        /**
         * @ngdoc method
         * @name $log#info
         *
         * @description
         * Write an information message
         */
        info: (...args: any[]) => any;
        /**
         * @ngdoc method
         * @name $log#warn
         *
         * @description
         * Write a warning message
         */
        warn: (...args: any[]) => any;
        /**
         * @ngdoc method
         * @name $log#error
         *
         * @description
         * Write an error message
         */
        error: (...args: any[]) => any;
        /**
         * @ngdoc method
         * @name $log#debug
         *
         * @description
         * Write a debug message
         */
        debug: (...args: any[]) => void;
    };
}
