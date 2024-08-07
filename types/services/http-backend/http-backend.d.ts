/**

 *
 *
 * @description
 * HTTP backend used by the {@link ng.$http service} that delegates to
 * XMLHttpRequest object and deals with browser incompatibilities.
 *
 * You should never need to use this service directly, instead use the higher-level abstractions:
 * {@link ng.$http $http}.
 *
 */
export function $HttpBackendProvider(): void;
export class $HttpBackendProvider {
    $get: (string | (($browser: import("../browser").Browser) => (method: any, url: any, post: any, callback: any, headers: any, timeout: any, withCredentials: any, responseType: any, eventHandlers: any, uploadEventHandlers: any) => void))[];
}
/**
 * @param {import('../browser').Browser} $browser
 * @param {*} $browserDefer
 * @returns
 */
export function createHttpBackend($browser: import("../browser").Browser, $browserDefer: any): (method: any, url: any, post: any, callback: any, headers: any, timeout: any, withCredentials: any, responseType: any, eventHandlers: any, uploadEventHandlers: any) => void;
