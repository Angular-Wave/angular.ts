export class TimeoutProvider {
    $get: (string | (($rootScope: import("../scope/scope").Scope, $browser: import("../../services/browser").Browser, $q: any, $exceptionHandler: import("../exception-handler").ErrorHandler) => {
        (fn?: (() => any) | undefined, delay?: number | undefined, invokeApply?: boolean, ...args: any[]): import("../q/q").QPromise<any>;
        cancel(promise: import("../q/q").QPromise<any>): boolean;
    }))[];
}
