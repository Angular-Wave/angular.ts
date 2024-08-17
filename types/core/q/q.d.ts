/**
 * @template T
 * @typedef {Object} QPromise
 * @property {function(
 *   ((value: T) => (PromiseLike<never>|PromiseLike<T>|T))|null,
 *   ((reason: any) => (PromiseLike<never>|PromiseLike<T>|T))|null,
 *   ((state: any) => any)=
 * ): QPromise<T|never>} then - Calls one of the success or error callbacks asynchronously as soon as the result is available.
 * @property {function(
 *   ((value: T) => (QPromise<never>|QPromise<T>|T))|null,
 *   ((reason: any) => (QPromise<never>|QPromise<never>|never))|null,
 *   ((state: any) => any)
 * ): QPromise<T|never>} then - Calls one of the success or error callbacks asynchronously as soon as the result is available.
 * @property {function(((reason: any) => (PromiseLike<never>|PromiseLike<T>|T))|null): QPromise<T>|T} catch - Shorthand for promise.then(null, errorCallback).
 * @property {function(((reason: any) => (QPromise<never>|QPromise<T>|T))|null): QPromise<T>|T} catch - Shorthand for promise.then(null, errorCallback).
 * @property {function(Array.<QPromise<T>>): QPromise<T>} all
 * @property {function(function(): void): QPromise<T>} finally - Allows you to observe either the fulfillment or rejection of a promise, but to do so without modifying the final value.
 * @property {number} [$$intervalId] - Internal id set by the $interval service for callback notifications
 * @property {number} [$$timeoutId] - Timeout id set by the $timeout service for cancelations
 */
/**
 *@template T
 * @typedef {Object} Deferred
 * @property {function(T|QPromise<T>): void} resolve - Resolves the promise with a value or another promise.
 * @property {function(any): void} reject - Rejects the promise with a reason.
 * @property {function(any): void} notify - Provides a progress notification.
 * @property {QPromise<T>} promise - The promise associated with this deferred object.
 */
export function $QProvider(): void;
export class $QProvider {
    $get: (string | (($rootScope: import("../scope/scope").Scope, $exceptionHandler: import("../exception-handler").ErrorHandler) => any))[];
    /**
     * @ngdoc method
     * @name $qProvider#errorOnUnhandledRejections
     * @kind function
     *
     * @description
     * Retrieves or overrides whether to generate an error when a rejected promise is not handled.
     * This feature is enabled by default.
     *
     * @param {boolean=} value Whether to generate an error when a rejected promise is not handled.
     * @returns {boolean|$QProvider} Current value when called without a new value or self for
     *    chaining otherwise.
     */
    errorOnUnhandledRejections: (value?: boolean | undefined) => boolean | $QProvider;
}
export function $$QProvider(): void;
export class $$QProvider {
    $get: (string | (($browser: any, $exceptionHandler: any) => any))[];
    errorOnUnhandledRejections: (value: any) => boolean | this;
}
export function markQExceptionHandled(q: any): void;
export type QPromise<T> = {
    /**
     * - Calls one of the success or error callbacks asynchronously as soon as the result is available.
     */
    then: (arg0: ((value: T) => (PromiseLike<never> | PromiseLike<T> | T)) | null, arg1: ((reason: any) => (PromiseLike<never> | PromiseLike<T> | T)) | null, arg2: ((state: any) => any) | undefined) => QPromise<T | never>;
    /**
     * - Shorthand for promise.then(null, errorCallback).
     */
    catch: (arg0: ((reason: any) => (PromiseLike<never> | PromiseLike<T> | T)) | null) => QPromise<T> | T;
    all: (arg0: Array<QPromise<T>>) => QPromise<T>;
    /**
     * - Allows you to observe either the fulfillment or rejection of a promise, but to do so without modifying the final value.
     */
    finally: (arg0: () => void) => QPromise<T>;
    /**
     * - Internal id set by the $interval service for callback notifications
     */
    $$intervalId?: number;
    /**
     * - Timeout id set by the $timeout service for cancelations
     */
    $$timeoutId?: number;
};
export type Deferred<T> = {
    /**
     * - Resolves the promise with a value or another promise.
     */
    resolve: (arg0: T | QPromise<T>) => void;
    /**
     * - Rejects the promise with a reason.
     */
    reject: (arg0: any) => void;
    /**
     * - Provides a progress notification.
     */
    notify: (arg0: any) => void;
    /**
     * - The promise associated with this deferred object.
     */
    promise: QPromise<T>;
};
