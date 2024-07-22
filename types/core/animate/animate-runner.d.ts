export function AnimateAsyncRunFactoryProvider(): void;
export class AnimateAsyncRunFactoryProvider {
    $get: (() => () => (callback: any) => void)[];
}
export function AnimateRunnerFactoryProvider(): void;
export class AnimateRunnerFactoryProvider {
    $get: (string | ((q: any, animateAsyncRun: any, timeout: any) => typeof AnimateRunner))[];
}
declare class AnimateRunner {
    static chain(chain: any, callback: any): void;
    static all(runners: any, callback: any): void;
    constructor(host: any);
    _doneCallbacks: any[];
    _tick: (fn: any) => void;
    _state: number;
    setHost(host: any): void;
    host: any;
    done(fn: any): void;
    progress(): void;
    getPromise(): any;
    promise: any;
    then(resolveHandler: any, rejectHandler: any): any;
    catch(handler: any): any;
    finally(handler: any): any;
    pause(): void;
    resume(): void;
    end(): void;
    cancel(): void;
    complete(response: any): void;
    _resolve(response: any): void;
}
export {};
