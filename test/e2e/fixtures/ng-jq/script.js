angular.module("test", []).run(($rootScope) => {
  $rootScope.jqueryVersion = angular.element().jquery || "jqLite";
});
