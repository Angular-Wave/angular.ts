/**
 * @constructor
 * @this {import('../types.js').ServiceProvider}
 */
export function ExceptionHandlerProvider(this: any): void;
export class ExceptionHandlerProvider {
    $get: (string | (($log: any) => ErrorHandler))[];
}
export function errorHandler(exception: any, cause: any): void;
export type ErrorHandler = (exception: Error, cause?: string) => void;
