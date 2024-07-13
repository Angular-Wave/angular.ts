/**
 * @constructor
 * @this {angular.ExceptionHandlerProvider}
 */
export function $ExceptionHandlerProvider(this: import("../index").angular.ServiceProvider): void;
export class $ExceptionHandlerProvider {
    $get: (string | (($log: import("../services/log").angular.LogService) => angular.ErrorHandler))[];
}
export function errorHandler(exception: any, cause: any): void;
export namespace angular {
    type ExceptionHandlerProvider = import("../index").angular.ServiceProvider;
    type ErrorHandler = (exception: Error, cause?: string) => void;
}
