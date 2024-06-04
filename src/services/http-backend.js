import { urlResolve } from "../core/urlUtils";
import { forEach, isDefined, isPromiseLike, isUndefined } from "../shared/utils";

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
export function $xhrFactoryProvider() {
  this.$get = () => {
    return function createXhr() {
      return new window.XMLHttpRequest();
    };
  };
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
export function $HttpBackendProvider() {
  this.$get = [
    "$browser",
    "$xhrFactory",
    function ($browser, $xhrFactory) {
      return createHttpBackend($browser, $xhrFactory, $browser.defer);
    },
  ];
}

export function createHttpBackend($browser, createXhr, $browserDefer) {
  // TODO(vojta): fix the signature
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
    url = url || $browser.url();

    let xhr = createXhr(method, url);
    let abortedByTimeout = false;

    xhr.open(method, url, true);
    forEach(headers, (value, key) => {
      if (isDefined(value)) {
        xhr.setRequestHeader(key, value);
      }
    });

    xhr.onload = function () {
      const statusText = xhr.statusText || "";

      // responseText is the old-school way of retrieving response (supported by IE9)
      // response/responseType properties were introduced in XHR Level2 spec (supported by IE10)
      const response = "response" in xhr ? xhr.response : xhr.responseText;

      let status = xhr.status;

      // fix status code when it is 0 (0 status is undocumented).
      // Occurs when accessing file resources or on Android 4.1 stock browser
      // while retrieving files from application cache.
      if (status === 0) {
        status = response ? 200 : urlResolve(url).protocol === "file" ? 404 : 0;
      }

      completeRequest(
        callback,
        status,
        response,
        xhr.getAllResponseHeaders(),
        statusText,
        "complete",
      );
    };

    xhr.onerror = function () {
      // The response is always empty
      // See https://xhr.spec.whatwg.org/#request-error-steps and https://fetch.spec.whatwg.org/#concept-network-error
      completeRequest(callback, -1, null, null, "", "error");
    };
    xhr.ontimeout = function () {
      // The response is always empty
      // See https://xhr.spec.whatwg.org/#request-error-steps and https://fetch.spec.whatwg.org/#concept-network-error
      completeRequest(callback, -1, null, null, "", "timeout");
    };

    xhr.onabort = function () {
      completeRequest(
        callback,
        -1,
        null,
        null,
        "",
        abortedByTimeout ? "timeout" : "abort",
      );
    };

    forEach(eventHandlers, (value, key) => {
      xhr.addEventListener(key, value);
    });

    forEach(uploadEventHandlers, (value, key) => {
      xhr.upload.addEventListener(key, value);
    });

    if (withCredentials) {
      xhr.withCredentials = true;
    }

    if (responseType) {
      try {
        xhr.responseType = responseType;
      } catch (e) {
        // WebKit added support for the json responseType value on 09/03/2013
        // https://bugs.webkit.org/show_bug.cgi?id=73648. Versions of Safari prior to 7 are
        // known to throw when setting the value "json" as the response type. Other older
        // browsers implementing the responseType
        //
        // The json response type can be ignored if not supported, because JSON payloads are
        // parsed on the client-side regardless.
        if (responseType !== "json") {
          throw e;
        }
      }
    }

    xhr.send(isUndefined(post) ? null : post);

    // Since we are using xhr.abort() when a request times out, we have to set a flag that
    // indicates to requestAborted if the request timed out or was aborted.
    //
    // http.timeout = numerical timeout   timeout
    // http.timeout = $timeout            timeout
    // http.timeout = promise             abort
    // xhr.abort()                        abort (The xhr object is normally inaccessible, but
    //                                    can be exposed with the xhrFactory)
    if (timeout > 0) {
      var timeoutId = $browserDefer(() => {
        timeoutRequest("timeout");
      }, timeout);
    } else if (isPromiseLike(timeout)) {
      timeout.then(() => {
        timeoutRequest(isDefined(timeout.$$timeoutId) ? "timeout" : "abort");
      });
    }

    function timeoutRequest(reason) {
      abortedByTimeout = reason === "timeout";
      if (xhr) {
        xhr.abort();
      }
    }

    function completeRequest(
      callback,
      status,
      response,
      headersString,
      statusText,
      xhrStatus,
    ) {
      // cancel timeout and subsequent timeout promise resolution
      if (isDefined(timeoutId)) {
        $browserDefer.cancel(timeoutId);
      }
      xhr = null;

      callback(status, response, headersString, statusText, xhrStatus);
    }
  };
}
