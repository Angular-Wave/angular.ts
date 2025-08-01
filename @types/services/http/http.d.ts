/**
 * Default params serializer that converts objects to strings
 * according to the following rules:
 *
 * * `{'foo': 'bar'}` results in `foo=bar`
 * * `{'foo': Date.now()}` results in `foo=2015-04-01T09%3A50%3A49.262Z` (`toISOString()` and encoded representation of a Date object)
 * * `{'foo': ['bar', 'baz']}` results in `foo=bar&foo=baz` (repeated key for each array element)
 * * `{'foo': {'bar':'baz'}}` results in `foo=%7B%22bar%22%3A%22baz%22%7D` (stringified and encoded representation of an object)
 *
 * Note that serializer will sort the request parameters alphabetically.
 */
export function HttpParamSerializerProvider(): void;
export class HttpParamSerializerProvider {
  $get: () => (params: any) => string;
}
export function defaultHttpResponseTransform(data: any, headers: any): any;
/**
 * Use `$httpProvider` to change the default behavior of the {@link ng.$http $http} service.
 */
export function HttpProvider(): void;
export class HttpProvider {
  defaults: {
    transformResponse: (typeof defaultHttpResponseTransform)[];
    transformRequest: ((d: any) => any)[];
    headers: {
      common: {
        Accept: string;
      };
      post: any;
      put: any;
      patch: any;
    };
    xsrfCookieName: string;
    xsrfHeaderName: string;
    paramSerializer: string;
  };
  /**
   * Configure $http service to combine processing of multiple http responses received at around
   * the same time via {@link ng.$rootScope.Scope#$applyAsync $rootScope.$applyAsync}. This can result in
   * significant performance improvement for bigger applications that make many HTTP requests
   * concurrently (common during application bootstrap).
   *
   * Defaults to false. If no value is specified, returns the current configured value.
   *
   * @param {boolean=} value If true, when requests are loaded, they will schedule a deferred
   *    "apply" on the next tick, giving time for subsequent requests in a roughly ~10ms window
   *    to load and share the same digest cycle.
   *
   * @returns {boolean|Object} If a value is specified, returns the $httpProvider for chaining.
   *    otherwise, returns the current configured value.
   */
  useApplyAsync: (value?: boolean | undefined) => boolean | any;
  /**
   * Array containing service factories for all synchronous or asynchronous {@link ng.$http $http}
   * pre-processing of request or postprocessing of responses.
   *
   * These service factories are ordered by request, i.e. they are applied in the same order as the
   * array, on request, but reverse order, on response.
   *
   * {@link ng.$http#interceptors Interceptors detailed info}
   */
  interceptors: any[];
  /**
   * Array containing URLs whose origins are trusted to receive the XSRF token. See the
   * {@link ng.$http#security-considerations Security Considerations} sections for more details on
   * XSRF.
   *
   * **Note:** An "origin" consists of the [URI scheme](https://en.wikipedia.org/wiki/URI_scheme),
   * the [hostname](https://en.wikipedia.org/wiki/Hostname) and the
   * [port number](https://en.wikipedia.org/wiki/Port_(computer_networking). For `http:` and
   * `https:`, the port number can be omitted if using th default ports (80 and 443 respectively).
   * Examples: `http://example.com`, `https://api.example.com:9876`
   *
   * <div class="alert alert-warning">
   *   It is not possible to trust specific URLs/paths. The `path`, `query` and `fragment` parts
   *   of a URL will be ignored. For example, `https://foo.com/path/bar?query=baz#fragment` will be
   *   treated as `https://foo.com`, meaning that **all** requests to URLs starting with
   *   `https://foo.com/` will include the XSRF token.
   * </div>
   *
   * @example
   *
   * ```js
   * // App served from `https://example.com/`.
   * angular.
   *   module('xsrfTrustedOriginsExample', []).
   *   config(['$httpProvider', function($httpProvider) {
   *     $httpProvider.xsrfTrustedOrigins.push('https://api.example.com');
   *   }]).
   *   run(['$http', function($http) {
   *     // The XSRF token will be sent.
   *     $http.get('https://api.example.com/preferences').then(...);
   *
   *     // The XSRF token will NOT be sent.
   *     $http.get('https://stats.example.com/activity').then(...);
   *   }]);
   * ```
   *
   * @type {string[]}
   */
  xsrfTrustedOrigins: string[];
  $get: (
    | string
    | ((
        $httpBackend: any,
        $injector: import("../../core/di/internal-injector.js").InjectorService,
        $sce: any,
      ) => {
        (requestConfig: any): Promise<any>;
        pendingRequests: any[];
        /**
         * Runtime equivalent of the `$httpProvider.defaults` property. Allows configuration of
         * default headers, withCredentials as well as request and response transformations.
         *
         * See "Setting HTTP Headers" and "Transforming Requests and Responses" sections above.
         */
        defaults: {
          transformResponse: (typeof defaultHttpResponseTransform)[];
          transformRequest: ((d: any) => any)[];
          headers: {
            common: {
              Accept: string;
            };
            post: any;
            put: any;
            patch: any;
          };
          xsrfCookieName: string;
          xsrfHeaderName: string;
          paramSerializer: string;
        };
      })
  )[];
}
