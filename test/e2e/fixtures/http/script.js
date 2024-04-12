angular
  .module("test", [])
  .config(($httpProvider) => {
    $httpProvider.interceptors.push(($q) => ({
      request(config) {
        return $q((resolve) => {
          window.setTimeout(resolve, 100, config);
        });
      },
      response(response) {
        return $q((resolve) => {
          window.setTimeout(resolve, 100, response);
        });
      },
    }));
  })
  .controller("TestController", ($cacheFactory, $http, $scope) => {
    const url = "/some/url";

    const cache = $cacheFactory("test");
    cache.put(url, "Hello, world!");

    $http.get(url, { cache }).then((response) => {
      $scope.text = response.data;
    });
  });
