/**
_ The `$http` service is a core AngularJS service that facilitates communication with the remote
_ HTTP servers via the browser's [XMLHttpRequest](https://developer.mozilla.org/en/xmlhttprequest)
_ object or via [JSONP](http://en.wikipedia.org/wiki/JSONP).
_
_ For unit testing applications that use `$http` service, see
_ {@link ngMock.$httpBackend $httpBackend mock}.
       *
       * For a higher level of abstraction, please check out the {@link ngResource.$resource
_ $resource} service.
_
_ The $http API is based on the {@link ng.$q deferred/promise APIs} exposed by
_ the $q service. While for simple usage patterns this doesn't matter much, for advanced usage
       * it is important to familiarize yourself with these APIs and the guarantees they provide.
       *
       *
       * ## General usage
       * The `$http`service is a function which takes a single argument — a {@link $http#usage configuration object} —
       * that is used to generate an HTTP request and returns  a {@link ng.$q promise} that is
       * resolved (request success) or rejected (request failure) with a
       * {@link ng.$http#$http-returns response} object.
       *
       * ```js
       *   // Simple GET request example:
       *   $http({
       *     method: 'GET',
       *     url: '/someUrl'
       *   }).then(function successCallback(response) {
       *       // this callback will be called asynchronously
       *       // when the response is available
       *     }, function errorCallback(response) {
       *       // called asynchronously if an error occurs
       *       // or server returns response with an error status.
       *     });
       * ```
       *
       *
       * ## Shortcut methods
       *
       * Shortcut methods are also available. All shortcut methods require passing in the URL, and
       * request data must be passed in for POST/PUT requests. An optional config can be passed as the
       * last argument.
       *
       * ```js
       *   $http.get('/someUrl', config).then(successCallback, errorCallback);
       *   $http.post('/someUrl', data, config).then(successCallback, errorCallback);
       * ```
       *
       * Complete list of shortcut methods:
       *
       * - {@link ng.$http#get $http.get}
       * - {@link ng.$http#head $http.head}
       * - {@link ng.$http#post $http.post}
       * - {@link ng.$http#put $http.put}
       * - {@link ng.$http#delete $http.delete}
       * - {@link ng.$http#patch $http.patch}
       *
       *
       * ```
       * $http.get(...);
       * $httpBackend.flush();
       * ```
       *
       * ## Setting HTTP Headers
       *
       * The $http service will automatically add certain HTTP headers to all requests. These defaults
       * can be fully configured by accessing the`$httpProvider.defaults.headers` configuration
       * object, which currently contains this default configuration:
       *
       * - `$httpProvider.defaults.headers.common`(headers that are common for all requests):
       *   - <code>Accept: application/json, text/plain, \*&#65279;/&#65279;\*</code>
       * -`$httpProvider.defaults.headers.post`: (header defaults for POST requests)
       *   - `Content-Type: application/json`
       * - `$httpProvider.defaults.headers.put`(header defaults for PUT requests)
       *   -`Content-Type: application/json`       *
       * To add or overwrite these defaults, simply add or remove a property from these configuration
       * objects. To add headers for an HTTP method other than POST or PUT, simply add a new object
       * with the lowercased HTTP method name as the key, e.g.
       *`$httpProvider.defaults.headers.get = { 'My-Header' : 'value' }`.
       *
       * The defaults can also be set at runtime via the `$http.defaults`object in the same
       * fashion. For example:
       *
       * ```
       * module.run(function($http) {
       *   $http.defaults.headers.common.Authorization = 'Basic YmVlcDpib29w';
       * });
       * ```
       *
       * In addition, you can supply a`headers`property in the config object passed when
       * calling`$http(config)`, which overrides the defaults without changing them globally.
       *
       * To explicitly remove a header automatically added via $httpProvider.defaults.headers on a per request basis,
       * Use the `headers`property, setting the desired header to`undefined`. For example:
       *
       * ```js
       * let req = {
       *  method: 'POST',
       *  url: 'http://example.com',
       *  headers: {
       *    'Content-Type': undefined
       *  },
       *  data: { test: 'test' }
       * }
       *
       * $http(req).then(function(){...}, function(){...});
       * ```
       *
       * ## Transforming Requests and Responses
       *
       * Both requests and responses can be transformed using transformation functions: `transformRequest`       * and`transformResponse`. These properties can be a single function that returns
       * the transformed value (`function(data, headersGetter, status)`) or an array of such transformation functions,
       * which allows you to `push`or`unshift` a new transformation function into the transformation chain. \*
_ <div class="alert alert-warning">
_ **Note:** AngularJS does not make a copy of the `data` parameter before it is passed into the `transformRequest` pipeline.
_ That means changes to the properties of `data` are not local to the transform function (since Javascript passes objects by reference).
_ For example, when calling `$http.get(url, $scope.myObject)`, modifications to the object's properties in a transformRequest
_ function will be reflected on the scope and in any templates where the object is data-bound.
_ To prevent this, transform functions should have no side-effects.
_ If you need to modify properties, it is recommended to make a copy of the data, or create new object to return.
_ </div> \*
_ ### Default Transformations
_
_ The `$httpProvider` provider and `$http` service expose `defaults.transformRequest` and
_ `defaults.transformResponse` properties. If a request does not provide its own transformations
_ then these will be applied.
_
_ You can augment or replace the default transformations by modifying these properties by adding to or
_ replacing the array. \*
_ AngularJS provides the following default transformations:
_
_ Request transformations (`$httpProvider.defaults.transformRequest` and `$http.defaults.transformRequest`) is
_ an array with one function that does the following: \*
_ - If the `data` property of the request configuration object contains an object, serialize it
_ into JSON format. \*
_ Response transformations (`$httpProvider.defaults.transformResponse` and `$http.defaults.transformResponse`) is
_ an array with one function that does the following: \*
_ - If XSRF prefix is detected, strip it (see Security Considerations section below).
_ - If the `Content-Type` is `application/json` or the response looks like JSON,
_ deserialize it using a JSON parser.
_ \*
_ ### Overriding the Default Transformations Per Request
_
_ If you wish to override the request/response transformations only for a single request then provide
_ `transformRequest` and/or `transformResponse` properties on the configuration object passed
_ into `$http`.
_
_ Note that if you provide these properties on the config object the default transformations will be
_ overwritten. If you wish to augment the default transformations then you must include them in your
_ local transformation array.
_
_ The following code demonstrates adding a new response transformation to be run after the default response
_ transformations have been run. \*
_ ```js
_ function appendTransform(defaults, transform) { \*
_ // We can't guarantee that the default transformation is an array
_ defaults = angular.isArray(defaults) ? defaults : [defaults]; \*
_ // Append the new transformation to the defaults
_ return defaults.concat(transform);
_ }
_
_ $http({
_ url: '...',
_ method: 'GET',
_ transformResponse: appendTransform($http.defaults.transformResponse, function(value) {
       *     return doTransform(value);
       *   })
       * });
       * ```
       *
       *
       * ## Caching
       *
       * {@link ng.$http `$http`} responses are not cached by default. To enable caching, you must
_ set the config.cache value or the default cache value to TRUE or to a cache object (created
_ with {@link ng.$cacheFactory `$cacheFactory`}). If defined, the value of config.cache takes
       * precedence over the default cache value.
       *
       * In order to:
       *   * cache all responses - set the default cache value to TRUE or to a cache object
       *   * cache a specific response - set config.cache value to TRUE or to a cache object
       *
       * If caching is enabled, but neither the default cache nor config.cache are set to a cache object,
       * then the default `$cacheFactory("$http")`object is used.
       *
       * The default cache value can be set by updating the
       * {@link ng.$http#defaults`$http.defaults.cache`} property or the
       * {@link $httpProvider#defaults `$httpProvider.defaults.cache`} property.
       *
       * When caching is enabled, {@link ng.$http `$http`} stores the response from the server using
       * the relevant cache object. The next time the same request is made, the response is returned
       * from the cache without sending a request to the server.
       *
       * Take note that:
       *
       *   * Only GET and JSONP requests are cached.
       *   * The cache key is the request URL including search parameters; headers are not considered.
       *   * Cached responses are returned asynchronously, in the same way as responses from the server.
       *   * If multiple identical requests are made using the same cache, which is not yet populated,
       *     one request will be made to the server and remaining requests will return the same response.
       *   * A cache-control header on the response does not affect if or how responses are cached.
       *
       *
       * ## Interceptors
       *
       * Before you start creating interceptors, be sure to understand the
       * {@link ng.$q $q and deferred/promise APIs}.
       *
       * For purposes of global error handling, authentication, or any kind of synchronous or
       * asynchronous pre-processing of request or postprocessing of responses, it is desirable to be
       * able to intercept requests before they are handed to the server and
       * responses before they are handed over to the application code that
       * initiated these requests. The interceptors leverage the {@link ng.$q
_ promise APIs} to fulfill this need for both synchronous and asynchronous pre-processing.
_
_ The interceptors are service factories that are registered with the `$httpProvider` by
_ adding them to the `$httpProvider.interceptors` array. The factory is called and
_ injected with dependencies (if specified) and returns the interceptor.
_
_ There are two kinds of interceptors (and two kinds of rejection interceptors):
_ \* _ `request`: interceptors get called with a http {@link $http#usage config} object. The function is free to
_ modify the `config` object or create a new one. The function needs to return the `config`
_ object directly, or a promise containing the `config` or a new `config` object.
_ _ `requestError`: interceptor gets called when a previous interceptor threw an error or
_ resolved with a rejection. \* _ `response`: interceptors get called with http `response` object. The function is free to
_ modify the `response` object or create a new one. The function needs to return the `response`
_ object directly, or as a promise containing the `response` or a new `response` object.
_ _ `responseError`: interceptor gets called when a previous interceptor threw an error or
_ resolved with a rejection. \* \*
_ ```js
_ // register the interceptor as a service
_ $provide.factory('myHttpInterceptor', function($q, dependency1, dependency2) {
_ return {
_ // optional method
_ 'request': function(config) {
_ // do something on success
_ return config;
_ },
_
_ // optional method
_ 'requestError': function(rejection) {
_ // do something on error
_ if (canRecover(rejection)) {
_ return responseOrNewPromise
_ }
_ return $q.reject(rejection);
_ }, \* \* \*
_ // optional method
_ 'response': function(response) {
_ // do something on success
_ return response;
_ },
_
_ // optional method
_ 'responseError': function(rejection) {
_ // do something on error
_ if (canRecover(rejection)) {
_ return responseOrNewPromise
_ }
_ return $q.reject(rejection);
_ }
_ };
_ }); \*
_ $httpProvider.interceptors.push('myHttpInterceptor');
_ \*
_ // alternatively, register the interceptor via an anonymous factory
_ $httpProvider.interceptors.push(function($q, dependency1, dependency2) {
_ return {
_ 'request': function(config) {
_ // same as above
_ }, \*
_ 'response': function(response) {
_ // same as above
_ }
_ };
_ });
_ ``       *
       * ## Security Considerations
       *
       * When designing web applications, consider security threats from:
       *
       * - [JSON vulnerability](http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx)
       * - [XSRF](http://en.wikipedia.org/wiki/Cross-site_request_forgery)
       *
       * Both server and the client must cooperate in order to eliminate these threats. AngularJS comes
       * pre-configured with strategies that address these issues, but for this to work backend server
       * cooperation is required.
       *
       * ### JSON Vulnerability Protection
       *
       * A [JSON vulnerability](http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx)
       * allows third party website to turn your JSON resource URL into
       * [JSONP](http://en.wikipedia.org/wiki/JSONP) request under some conditions. To
       * counter this your server can prefix all JSON requests with following string `")]}',\n"`.
       * AngularJS will automatically strip the prefix before processing it as JSON.
       *
       * For example if your server needs to return:
       *``js
_ ['one','two']
_ `       *
       * which is vulnerable to attack, your server can return:
       *`js
_ )]}',
_ ['one','two']
_ ```
_
_ AngularJS will strip the prefix, before processing the JSON.
_ \*
_ ### Cross Site Request Forgery (XSRF) Protection
_
_ [XSRF](http://en.wikipedia.org/wiki/Cross-site_request_forgery) is an attack technique by
_ which the attacker can trick an authenticated user into unknowingly executing actions on your
_ website. AngularJS provides a mechanism to counter XSRF. When performing XHR requests, the
_ $http service reads a token from a cookie (by default, `XSRF-TOKEN`) and sets it as an HTTP
_ header (by default `X-XSRF-TOKEN`). Since only JavaScript that runs on your domain could read
_ the cookie, your server can be assured that the XHR came from JavaScript running on your
_ domain.
_
_ To take advantage of this, your server needs to set a token in a JavaScript readable session
_ cookie called `XSRF-TOKEN` on the first HTTP GET request. On subsequent XHR requests the
_ server can verify that the cookie matches the `X-XSRF-TOKEN` HTTP header, and therefore be
_ sure that only JavaScript running on your domain could have sent the request. The token must
_ be unique for each user and must be verifiable by the server (to prevent the JavaScript from
_ making up its own tokens). We recommend that the token is a digest of your site's
_ authentication cookie with a [salt](https://en.wikipedia.org/wiki/Salt_(cryptography&#41;)
\_ for added security. \* \* The header will &mdash; by default &mdash; **not** be set for cross-domain requests. This
_ prevents unauthorized servers (e.g. malicious or compromised 3rd-party APIs) from gaining
_ access to your users' XSRF tokens and exposing them to Cross Site Request Forgery. If you
_ want to, you can trust additional origins to also receive the XSRF token, by adding them
_ to {@link ng.$httpProvider#xsrfTrustedOrigins xsrfTrustedOrigins}. This might be
       * useful, for example, if your application, served from `example.com`, needs to access your API
       * at `api.example.com`.
       * See {@link ng.$httpProvider#xsrfTrustedOrigins $httpProvider.xsrfTrustedOrigins} for
_ more details.
_
_ <div class="alert alert-danger">
_ **Warning**<br />
_ Only trusted origins that you have control over and make sure you understand the
_ implications of doing so.
_ </div>
_
_ The name of the cookie and the header can be specified using the `xsrfCookieName` and
_ `xsrfHeaderName` properties of either `$httpProvider.defaults` at config-time,
_ `$http.defaults` at run-time, or the per-request config object.
_
_ In order to prevent collisions in environments where multiple AngularJS apps share the
_ same domain or subdomain, we recommend that each application uses a unique cookie name. \* \*
_ @param {object} requestConfig Object describing the request to be made and how it should be
_ processed. The object has following properties: \* \* - **method** – `{string}` – HTTP method (e.g. 'GET', 'POST', etc) \* - **url** – `{string|TrustedObject}` – Absolute or relative URL of the resource that is being requested;
_ or an object created by a call to `$sce.trustAsResourceUrl(url)`.
_ - **params** – `{Object.<string|Object>}` – Map of strings or objects which will be serialized
_ with the `paramSerializer` and appended as GET parameters.
_ - **data** – `{string|Object}` – Data to be sent as the request message data. \* - **headers** – `{Object}` – Map of strings or functions which return strings representing
_ HTTP headers to send to the server. If the return value of a function is null, the
_ header will not be sent. Functions accept a config object as an argument. \* - **eventHandlers** - `{Object}` - Event listeners to be bound to the XMLHttpRequest object.
_ To bind events to the XMLHttpRequest upload object, use `uploadEventHandlers`.
_ The handler will be called in the context of a `$apply` block. \* - **uploadEventHandlers** - `{Object}` - Event listeners to be bound to the XMLHttpRequest upload
_ object. To bind events to the XMLHttpRequest object, use `eventHandlers`.
_ The handler will be called in the context of a `$apply` block. \* - **xsrfHeaderName** – `{string}` – Name of HTTP header to populate with the XSRF token. \* - **xsrfCookieName** – `{string}` – Name of cookie containing the XSRF token. \* - **transformRequest** –
_ `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` –
_ transform function or an array of such functions. The transform function takes the http
_ request body and headers and returns its transformed (typically serialized) version.
_ See {@link ng.$http#overriding-the-default-transformations-per-request
_ Overriding the Default Transformations}
_ - **transformResponse** –
_ `{function(data, headersGetter, status)|Array.<function(data, headersGetter, status)>}` –
_ transform function or an array of such functions. The transform function takes the http
_ response body, headers and status and returns its transformed (typically deserialized) version.
_ See {@link ng.$http#overriding-the-default-transformations-per-request
_ Overriding the Default Transformations}
_ - **paramSerializer** - `{string|function(Object<string,string>):string}` - A function used to
_ prepare the string representation of request parameters (specified as an object).
_ If specified as string, it is interpreted as function registered with the
_ {@link $injector $injector}, which means you can create your own serializer
_ by registering it as a {@link auto.$provide#service service}.
_ The default serializer is the {@link $httpParamSerializer $httpParamSerializer};
_ alternatively, you can use the {@link $httpParamSerializerJQLike $httpParamSerializerJQLike} \* - **cache** – `{boolean|Object}` – A boolean value or object created with
_ {@link ng.$cacheFactory `$cacheFactory`} to enable or disable caching of the HTTP response.
_ See {@link $http#caching $http Caching} for more information. \* - **timeout** – `{number|Promise}` – timeout in milliseconds, or {@link ng.$q promise}
       *      that should abort the request when resolved.
       *
       *      A numerical timeout or a promise returned from {@link ng.$timeout $timeout}, will set
       *      the `xhrStatus` in the {@link $http#$http-returns response} to "timeout", and any other
_ resolved promise will set it to "abort", following standard XMLHttpRequest behavior.
_ \* - **withCredentials** - `{boolean}` - whether to set the `withCredentials` flag on the
_ XHR object. See [requests with credentials](https://developer.mozilla.org/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials)
_ for more information. \* - **responseType** - `{string}` - see
_ [XMLHttpRequest.responseType](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#xmlhttprequest-responsetype).
_
_ @returns {PromiseLike} A {@link ng.$q `Promise}` that will be resolved (request success)
_ or rejected (request failure) with a response object. \*
_ The response object has these properties:
_ \* - **data** – `{string|Object}` – The response body transformed with
_ the transform functions.
_ - **status** – `{number}` – HTTP status code of the response. \* - **headers** – `{function([headerName])}` – Header getter function. \* - **config** – `{Object}` – The configuration object that was used
_ to generate the request.
_ - **statusText** – `{string}` – HTTP status text of the response. \* - **xhrStatus\*_ – `{string}` – Status of the XMLHttpRequest
_ (`complete`, `error`, `timeout` or `abort`). \* \*
_ A response status code between 200 and 299 is considered a success status
_ and will result in the success callback being called. Any response status
_ code outside of that range is considered an error status and will result
_ in the error callback being called.
_ Also, status codes less than -1 are normalized to zero. -1 usually means
_ the request was aborted, e.g. using a `config.timeout`. More information
_ about the status might be available in the `xhrStatus` property.
_
_ Note that if the response is a redirect, XMLHttpRequest will transparently
_ follow it, meaning that the outcome (success or error) will be determined
_ by the final response status code.
_ \*
_ @property {Array.<Object>} pendingRequests Array of config objects for currently pending
_ requests. This is primarily meant to be used for debugging purposes. \*
\*/
