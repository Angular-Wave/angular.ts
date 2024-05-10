

angular.module('repeatAnimateBenchmark', ['ngAnimate'])
  .config(($animateProvider) => {
    $animateProvider.classNameFilter(/animate-/);
  })
  .run(($rootScope) => {
    $rootScope.fileType = 'classfilter';
  });
