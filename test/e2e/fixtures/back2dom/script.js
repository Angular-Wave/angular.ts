angular.module("test", []).run(($rootScope) => {
  $rootScope.internalFnCalled = false;

  $rootScope.internalFn = function () {
    $rootScope.internalFnCalled = true;
  };
});
