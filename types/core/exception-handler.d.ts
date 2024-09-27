/**
 * @constructor
 * @this {import('../types').ServiceProvider}
 */
export function ExceptionHandlerProvider(this: any): void;
export class ExceptionHandlerProvider {
    $get: (string | (($log: import("../services/log").LogService) => ErrorHandler))[];
}
export function errorHandler(exception: any, cause: any): void;
export type ErrorHandler = (exception: Error, cause?: string) => void;
