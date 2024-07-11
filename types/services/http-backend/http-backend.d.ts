/**
 * @ngdoc service
 * @name $xhrFactory
 *
 *
 * @description
 * Factory function used to create XMLHttpRequest objects.
 *
 * Replace or decorate this service to create your own custom XMLHttpRequest objects.
 *
 * ```
 * angular.module('myApp', [])
 * .factory('$xhrFactory', function() {
 *   return function createXhr(method, url) {
 *     return new window.XMLHttpRequest({mozSystem: true});
 *   };
 * });
 * ```
 *
 * @param {string} method HTTP method of the request (GET, POST, PUT, ..)
 * @param {string} url URL of the request.
 */
export function $xhrFactoryProvider(): void;
export class $xhrFactoryProvider {
    $get: () => () => XMLHttpRequest;
}
/**
 * @ngdoc service
 * @name $httpBackend
 * @requires $document
 * @requires $xhrFactory
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
    $get: (string | (($browser: any, $xhrFactory: any) => (method: any, url: any, post: any, callback: any, headers: any, timeout: any, withCredentials: any, responseType: any, eventHandlers: any, uploadEventHandlers: any) => void))[];
}
export function createHttpBackend($browser: any, createXhr: any, $browserDefer: any): (method: any, url: any, post: any, callback: any, headers: any, timeout: any, withCredentials: any, responseType: any, eventHandlers: any, uploadEventHandlers: any) => void;
