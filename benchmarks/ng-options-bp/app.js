

/* globals angular, benchmarkSteps */

const app = angular.module('ngOptionsBenchmark', []);

app.config(($compileProvider) => {
  if ($compileProvider.debugInfoEnabled) {
    $compileProvider.debugInfoEnabled(false);
  }
});



app.controller('DataController', ($scope, $element) => {
  $scope.items = [];
  $scope.count = 10000;

  function changeOptions() {
    $scope.items = [];
    for (let i = 0; i < $scope.count; ++i) {
      $scope.items.push({
        id: i,
        label: `item-${  i}`,
        group: `group-${  i % 100}`
      });
    }
  }

  const selectElement = $element.find('select');
  console.log(selectElement);


  benchmarkSteps.push({
    name: 'add-options',
    fn() {
      $scope.$apply(() => {
        $scope.count = 10000;
        changeOptions();
      });
    }
  });

  benchmarkSteps.push({
    name: 'set-model-1',
    fn() {
      $scope.$apply(() => {
        $scope.x = $scope.items[1000];
      });
    }
  });

  benchmarkSteps.push({
    name: 'set-model-2',
    fn() {
      $scope.$apply(() => {
        $scope.x = $scope.items[10];
      });
    }
  });

  benchmarkSteps.push({
    name: 'remove-options',
    fn() {
      $scope.count = 100;
      changeOptions();
    }
  });

  benchmarkSteps.push({
    name: 'add-options',
    fn() {
      $scope.$apply(() => {
        $scope.count = 10000;
        changeOptions();
      });
    }
  });

  benchmarkSteps.push({
    name: 'set-view-1',
    fn() {
      selectElement.val('2000');
      selectElement.triggerHandler('change');
    }
  });

  benchmarkSteps.push({
    name: 'set-view-2',
    fn() {
      selectElement.val('1000');
      selectElement.triggerHandler('change');
    }
  });
});
