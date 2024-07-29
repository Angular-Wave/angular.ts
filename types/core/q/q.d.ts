/**
 * @ngdoc provider
 * @name $qProvider
 *
 *
 * @description
 */
export function $QProvider(): void;
export class $QProvider {
    $get: (string | (($rootScope: any, $exceptionHandler: import("../exception-handler").ErrorHandler) => any))[];
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
export namespace angular {
    type QPromise<T> = {
        /**
         * - Calls one of the success or error callbacks asynchronously as soon as the result is available.
         */
        then: (arg0: ((value: T) => (PromiseLike<never> | PromiseLike<T> | T)) | null, arg1: ((reason: any) => (PromiseLike<never> | PromiseLike<T> | T)) | null, arg2: ((state: any) => any)) => angular.QPromise<T | never>;
        /**
         * - Shorthand for promise.then(null, errorCallback).
         */
        catch: (arg0: ((reason: any) => (PromiseLike<never> | PromiseLike<T> | T)) | null) => angular.QPromise<T> | T;
        /**
         * - Allows you to observe either the fulfillment or rejection of a promise, but to do so without modifying the final value.
         */
        finally: (arg0: () => void) => angular.QPromise<T>;
    };
    type Deferred<T> = {
        /**
         * - Resolves the promise with a value or another promise.
         */
        resolve: (arg0: T | angular.QPromise<T>) => void;
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
        promise: angular.QPromise<T>;
    };
}
