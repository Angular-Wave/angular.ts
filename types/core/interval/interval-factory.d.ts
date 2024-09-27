export function $IntervalFactoryProvider(): void;
export class $IntervalFactoryProvider {
    $get: (string | (($browser: import("../../services/browser").Browser, $q: any, $$q: any, $rootScope: import("../scope/scope").Scope) => (setIntervalFn: any, clearIntervalFn: any) => (fn: any, delay: any, count: any, invokeApply: any, ...args: any[]) => any))[];
}
