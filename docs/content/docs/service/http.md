---
title: $http
description: >
  HTTP service
---

# `$http` Service (AngularTS)

The `$http` service is a core AngularTS service that facilitates communication
with remote HTTP servers via the browser's
[XMLHttpRequest](https://developer.mozilla.org/en/xmlhttprequest) object or via
[JSONP](http://en.wikipedia.org/wiki/JSONP).

For unit testing applications that use the `$http` service, see
[`$httpBackend` mock](https://docs.angularjs.org/api/ngMock/service/$httpBackend).

For a higher-level abstraction, see the
[`$resource`](https://docs.angularjs.org/api/ngResource/service/$resource)
service.

The `$http` API is based on the
[`$q` deferred/promise APIs](https://docs.angularjs.org/api/ng/service/$q).
Familiarity with these APIs is important for advanced usage.

---

## General Usage

The `$http` service is a function that takes a single argument — a
**configuration object** — used to generate an HTTP request. It returns a
**promise** that resolves on success or rejects on failure with a **response
object**.

```js
$http({
  method: 'GET',
  url: '/someUrl'
}).then(function successCallback(response) {
  // Called asynchronously when the response is available
}, function errorCallback(response) {
  // Called asynchronously if an error occurs or the server returns an error
});

Shortcut Methods

Shortcut methods are available for all common HTTP methods. All require a URL; POST/PUT requests require data. An optional config object can be passed as the last argument.

$http.get('/someUrl', config).then(successCallback, errorCallback);
$http.post('/someUrl', data, config).then(successCallback, errorCallback);


Shortcut methods list:

$http.get
$http.head
$http.post
$http.put
$http.delete
$http.patch

$http.get(...);

Setting HTTP Headers

The $http service automatically adds certain HTTP headers to all requests. These defaults can be configured using $httpProvider.defaults.headers.

Default headers:

Common headers: Accept: application/json, text/plain, */*

POST headers: Content-Type: application/json

PUT headers: Content-Type: application/json

You can modify defaults:

$httpProvider.defaults.headers.get = { 'My-Header': 'value' };


Or modify headers globally at runtime:

module.run(function($http) {
  $http.defaults.headers.common.Authorization = 'Basic YmVlcDpib29w';
});


Per-request overrides:

let req = {
  method: 'POST',
  url: 'http://example.com',
  headers: {
    'Content-Type': undefined
  },
  data: { test: 'test' }
};

$http(req).then(success, error);

Transforming Requests and Responses

Requests and responses can be transformed using transformRequest and transformResponse. Each can be a single function or an array of functions. Functions take (data, headersGetter[, status]) and return the transformed value.

Note: AngularTS does not make a copy of data before passing it to transformRequest. Avoid side effects.

Default transformations:

Requests: objects are serialized to JSON

Responses: XSRF prefix removed; JSON responses are parsed

Per-request override example:

function appendTransform(defaults, transform) {
  defaults = angular.isArray(defaults) ? defaults : [defaults];
  return defaults.concat(transform);
}

$http({
  url: '...',
  method: 'GET',
  transformResponse: appendTransform($http.defaults.transformResponse, function(value) {
    return doTransform(value);
  })
});

Caching

By default, $http responses are not cached. Enable caching with:

config.cache = true or a cache object

Global default cache: $http.defaults.cache = true

Only GET and JSONP requests are cached.

Interceptors

Interceptors allow modification of requests/responses globally. Add factories to $httpProvider.interceptors.

Interceptor types:

request(config)

requestError(rejection)

response(response)

responseError(rejection)

Example:

$provide.factory('myHttpInterceptor', function($q) {
  return {
    request: function(config) { return config; },
    responseError: function(rejection) { return $q.reject(rejection); }
  };
});

$httpProvider.interceptors.push('myHttpInterceptor');
```
