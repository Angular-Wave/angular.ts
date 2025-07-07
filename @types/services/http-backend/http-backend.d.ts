/**
 * @param {import('../browser.js').Browser} $browser
 * @returns
 */
export function createHttpBackend(
  $browser: import("../browser.js").Browser,
): (
  method: any,
  url: any,
  post: any,
  callback: any,
  headers: any,
  timeout: any,
  withCredentials: any,
  responseType: any,
  eventHandlers: any,
  uploadEventHandlers: any,
) => void;
/**
 * HTTP backend used by the {@link ng.$http service} that delegates to
 * XMLHttpRequest object and deals with browser incompatibilities.
 *
 * You should never need to use this service directly, instead use the higher-level abstractions:
 * {@link ng.$http $http}.
 *
 */
/**
 * HTTP backend used by the {@link ng.$http service} that delegates to
 * XMLHttpRequest object and deals with browser incompatibilities.
 *
 * You should never need to use this service directly, instead use the higher-level abstractions:
 * {@link ng.$http $http}.
 *
 */
export class HttpBackendProvider {
  $get: (
    | string
    | ((
        $browser: import("../browser.js").Browser,
      ) => (
        method: any,
        url: any,
        post: any,
        callback: any,
        headers: any,
        timeout: any,
        withCredentials: any,
        responseType: any,
        eventHandlers: any,
        uploadEventHandlers: any,
      ) => void)
  )[];
}
