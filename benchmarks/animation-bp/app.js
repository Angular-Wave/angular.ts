

angular
  .module('animationBenchmark', ['ngAnimate'], config)
  .controller('BenchmarkController', BenchmarkController);

// Functions - Definitions
function config($compileProvider) {
  $compileProvider
    .commentDirectivesEnabled(false)
    .cssClassDirectivesEnabled(false)
    .debugInfoEnabled(false);
}

function BenchmarkController($scope) {
  const self = this;
  const itemCount = 1000;
  const items = (new Array(itemCount + 1)).join('.').split('');

  benchmarkSteps.push({
    name: 'create',
    fn() {
      $scope.$apply(() => {
        self.items = items;
      });
    }
  });

  benchmarkSteps.push({
    name: '$digest',
    fn() {
      $scope.$root.$digest();
    }
  });

  benchmarkSteps.push({
    name: 'destroy',
    fn() {
      $scope.$apply(() => {
        self.items = [];
      });
    }
  });
}
