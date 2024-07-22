/**
 *
 * @description
 * This is a private service for reading cookies used by $http and ngCookies
 *
 * @return {Object} a key/value map of the current cookies
 */
export function $$CookieReader(): any;
export function CookieReaderProvider(): void;
export class CookieReaderProvider {
    $get: typeof $$CookieReader;
}
