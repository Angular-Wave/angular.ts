import { trimEmptyHash, urlResolve } from "../../shared/url-utils/url-utils.js";
import { isDefined, isPromiseLike, isUndefined } from "../../shared/utils.js";

/**
 * HTTP backend used by the `$http` that delegates to
 * XMLHttpRequest object and deals with browser incompatibilities.
 * You should never need to use this service directly.
 */
export class HttpBackendProvider {
  constructor() {
    this.$get = () => createHttpBackend();
  }
}

/**
 * @returns
 */
export function createHttpBackend() {
  /**
   * Makes an HTTP request using XMLHttpRequest with flexible options.
   *
   * @param {string} method - The HTTP method (e.g., "GET", "POST").
   * @param {string} [url] - The URL to send the request to. Defaults to the current page URL.
   * @param {*} [post] - The body to send with the request, if any.
   * @param {function(number, any, string|null, string, string): void} [callback] - Callback invoked when the request completes.
   * @param {Object<string, string|undefined>} [headers] - Headers to set on the request.
   * @param {number|Promise<any>} [timeout] - Timeout in ms or a cancellable promise.
   * @param {boolean} [withCredentials] - Whether to send credentials with the request.
   * @param {XMLHttpRequestResponseType} [responseType] - The type of data expected in the response.
   * @param {Object<string, EventListener>} [eventHandlers] - Event listeners for the XMLHttpRequest object.
   * @param {Object<string, EventListener>} [uploadEventHandlers] - Event listeners for the XMLHttpRequest.upload object.
   * @returns {void}
   */
  return function (
    method,
    url,
    post,
    callback,
    headers,
    timeout,
    withCredentials,
    responseType,
    eventHandlers,
    uploadEventHandlers,
  ) {
    url = url || trimEmptyHash(window.location.href);

    const xhr = new XMLHttpRequest();
    let abortedByTimeout = false;
    let timeoutId;

    xhr.open(method, url, true);

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        if (isDefined(value)) {
          xhr.setRequestHeader(key, value);
        }
      }
    }

    xhr.onload = () => {
      let status = xhr.status || 0;
      const statusText = xhr.statusText || "";

      if (status === 0) {
        status = xhr.response
          ? 200
          : urlResolve(url).protocol === "file"
            ? 404
            : 0;
      }

      completeRequest(
        status,
        xhr.response,
        xhr.getAllResponseHeaders(),
        statusText,
        "complete",
      );
    };

    xhr.onerror = () => completeRequest(-1, null, null, "", "error");
    xhr.ontimeout = () => completeRequest(-1, null, null, "", "timeout");

    xhr.onabort = () => {
      completeRequest(
        -1,
        null,
        null,
        "",
        abortedByTimeout ? "timeout" : "abort",
      );
    };

    if (eventHandlers) {
      for (const [key, handler] of Object.entries(eventHandlers)) {
        xhr.addEventListener(key, handler);
      }
    }

    if (uploadEventHandlers) {
      for (const [key, handler] of Object.entries(uploadEventHandlers)) {
        xhr.upload.addEventListener(key, handler);
      }
    }

    if (withCredentials) {
      xhr.withCredentials = true;
    }

    if (responseType) {
      try {
        xhr.responseType = responseType;
      } catch (e) {
        if (responseType !== "json") throw e;
      }
    }

    xhr.send(isUndefined(post) ? null : post);

    if (typeof timeout === "number" && timeout > 0) {
      timeoutId = setTimeout(() => timeoutRequest("timeout"), timeout);
    } else if (isPromiseLike(timeout)) {
      /** @type {Promise} */ (timeout).then(() => {
        timeoutRequest(isDefined(timeout["$$timeoutId"]) ? "timeout" : "abort");
      });
    }

    /**
     * @param {"timeout"|"abort"} reason
     */
    function timeoutRequest(reason) {
      abortedByTimeout = reason === "timeout";
      if (xhr) xhr.abort();
    }

    /**
     * @param {number} status - HTTP status code or -1 for network errors.
     * @param {*} response - The parsed or raw response from the server.
     * @param {string|null} headersString - The raw response headers as a string.
     * @param {string} statusText - The status text returned by the server.
     * @param {"complete"|"error"|"timeout"|"abort"} xhrStatus - Final status of the request.
     */
    function completeRequest(
      status,
      response,
      headersString,
      statusText,
      xhrStatus,
    ) {
      if (isDefined(timeoutId)) {
        clearTimeout(timeoutId);
      }
      callback(status, response, headersString, statusText, xhrStatus);
    }
  };
}
