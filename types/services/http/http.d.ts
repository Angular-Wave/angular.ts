export function $HttpParamSerializerProvider(): void;
export class $HttpParamSerializerProvider {
    /**
     * @ngdoc service
     * @name $httpParamSerializer
     * @description
     *
     * Default {@link $http `$http`} params serializer that converts objects to strings
     * according to the following rules:
     *
     * * `{'foo': 'bar'}` results in `foo=bar`
     * * `{'foo': Date.now()}` results in `foo=2015-04-01T09%3A50%3A49.262Z` (`toISOString()` and encoded representation of a Date object)
     * * `{'foo': ['bar', 'baz']}` results in `foo=bar&foo=baz` (repeated key for each array element)
     * * `{'foo': {'bar':'baz'}}` results in `foo=%7B%22bar%22%3A%22baz%22%7D` (stringified and encoded representation of an object)
     *
     * Note that serializer will sort the request parameters alphabetically.
     */
    $get: () => (params: any) => string;
}
export function $HttpParamSerializerJQLikeProvider(): void;
export class $HttpParamSerializerJQLikeProvider {
    /**
     * @ngdoc service
     * @name $httpParamSerializerJQLike
     *
     * @description
     *
     * Alternative {@link $http `$http`} params serializer that follows
     * jQuery's [`param()`](http://api.jquery.com/jquery.param/) method logic.
     * The serializer will also sort the params alphabetically.
     *
     * To use it for serializing `$http` request parameters, set it as the `paramSerializer` property:
     *
     * ```js
     * $http({
     *   url: myUrl,
     *   method: 'GET',
     *   params: myParams,
     *   paramSerializer: '$httpParamSerializerJQLike'
     * });
     * ```
     *
     * It is also possible to set it as the default `paramSerializer` in the
     * {@link $httpProvider#defaults `$httpProvider`}.
     *
     * Additionally, you can inject the serializer and use it explicitly, for example to serialize
     * form data for submission:
     *
     * ```js
     * .controller(function($http, $httpParamSerializerJQLike) {
     *   //...
     *
     *   $http({
     *     url: myUrl,
     *     method: 'POST',
     *     data: $httpParamSerializerJQLike(myData),
     *     headers: {
     *       'Content-Type': 'application/x-www-form-urlencoded'
     *     }
     *   });
     *
     * });
     * ```
     *
     */
    $get: () => (params: any) => string;
}
export function defaultHttpResponseTransform(data: any, headers: any): any;
/**
 * @ngdoc provider
 * @name $httpProvider
 *
 *
 * @description
 * Use `$httpProvider` to change the default behavior of the {@link ng.$http $http} service.
 */
export function $HttpProvider(): void;
export class $HttpProvider {
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
     * @ngdoc method
     * @name $httpProvider#useApplyAsync
     * @description
     *
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
    interceptors: any[];
    xsrfTrustedOrigins: any[];
    $get: (string | (($browser: any, $httpBackend: any, $$cookieReader: any, $cacheFactory: any, $rootScope: any, $q: any, $injector: import("../../core/di/internal-injector").InjectorService, $sce: any) => {
        (requestConfig: any): HttpPromise;
        pendingRequests: any[];
        /**
         * @ngdoc property
         * @name $http#defaults
         *
         * @description
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
    }))[];
}
