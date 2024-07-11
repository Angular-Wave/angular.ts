/**
 * @name $$cookieReader
 * @requires $document
 *
 * @description
 * This is a private service for reading cookies used by $http and ngCookies
 *
 * @return {Object} a key/value map of the current cookies
 */
export function $$CookieReader($document: any): any;
export namespace $$CookieReader {
    let $inject: string[];
}
export function CookieReaderProvider(): void;
export class CookieReaderProvider {
    $get: typeof $$CookieReader;
}
