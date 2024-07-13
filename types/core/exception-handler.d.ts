/**
 * @constructor
 * @this {ExceptionHandlerProvider}
 */
export function $ExceptionHandlerProvider(this: import("../types").ServiceProvider): void;
export class $ExceptionHandlerProvider {
    $get: (string | (($log: any) => ErrorHandler))[];
}
export function errorHandler(exception: any, cause: any): void;
export type ExceptionHandlerProvider = import("../types").ServiceProvider;
export type ErrorHandler = (exception: Error, cause?: string) => void;
