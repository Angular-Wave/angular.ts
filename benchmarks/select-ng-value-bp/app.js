

const app = angular.module('selectBenchmark', []);

app.config(($compileProvider) => {
  if ($compileProvider.debugInfoEnabled) {
    $compileProvider.debugInfoEnabled(false);
  }
});



app.controller('DataController', ($scope, $element) => {
  $scope.groups = [];
  $scope.count = 10000;

  function changeOptions() {
    $scope.groups = [];
    let i = 0;
    let group;
    while (i < $scope.count) {
      if (i % 100 === 0) {
        group = {
          name: `group-${  $scope.groups.length}`,
          items: []
        };
        $scope.groups.push(group);
      }
      group.items.push({
        id: i,
        label: `item-${  i}`
      });
      i++;
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
        $scope.x = $scope.groups[10].items[0];
      });
    }
  });

  benchmarkSteps.push({
    name: 'set-model-2',
    fn() {
      $scope.$apply(() => {
        $scope.x = $scope.groups[0].items[10];
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
