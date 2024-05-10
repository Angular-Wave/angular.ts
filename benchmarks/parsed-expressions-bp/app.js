

const app = angular.module('parsedExpressionBenchmark', []);

app.config(($compileProvider) => {
  if ($compileProvider.debugInfoEnabled) {
    $compileProvider.debugInfoEnabled(false);
  }
});

app.filter('noop', () => function(input) {
    return input;
  });

// Executes the specified expression as a watcher
app.directive('bmPeWatch', () => ({
    restrict: 'A',
    compile($element, $attrs) {
      $element.text($attrs.bmPeWatch);
      return function($scope, $element, $attrs) {
        $scope.$watch($attrs.bmPeWatch, (val) => {
          $element.text(val);
        });
      };
    }
  }));

// Executes the specified expression as a collection watcher
app.directive('bmPeWatchCollection', () => ({
    restrict: 'A',
    compile($element, $attrs) {
      $element.text($attrs.bmPeWatchCollection);
      return function($scope, $element, $attrs) {
        $scope.$watchCollection($attrs.bmPeWatchCollection, (val) => {
          $element.text(val);
        });
      };
    }
  }));

app.controller('DataController', ($scope, $rootScope) => {
  const totalRows = 10000;

  const data = $scope.data = [];

  const star = '*';

  $scope.func = function() { return star; };

  for (let i = 0; i < totalRows; i++) {
    data.push({
      index: i,
      odd: i % 2 === 0,
      even: i % 2 === 1,
      str0: `foo-${  Math.random() * Date.now()}`,
      str1: `bar-${  Math.random() * Date.now()}`,
      str2: `baz-${  Math.random() * Date.now()}`,
      num0: Math.random() * Date.now(),
      num1: Math.random() * Date.now(),
      num2: Math.random() * Date.now(),
      date0: new Date(Math.random() * Date.now()),
      date1: new Date(Math.random() * Date.now()),
      date2: new Date(Math.random() * Date.now()),
      func() { return star; },
      obj: data[i - 1],
      keys: data[i - 1] && (data[i - 1].keys || Object.keys(data[i - 1]))
    });
  }

  benchmarkSteps.push({
    name: '$apply',
    fn() {
      for (let i = 0; i < 50; i++) {
        $rootScope.$digest();
      }
    }
  });
});
