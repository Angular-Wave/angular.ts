

const app = angular.module('eventDelegationBenchmark', []);

app.directive('noopDir', () => ({
    compile($element, $attrs) {
      return function($scope, $element) {
        return 1;
      };
    }
  }));

app.directive('nativeClick', ['$parse', function($parse) {
  return {
    compile($element, $attrs) {
      $parse($attrs.tstEvent);
      return function($scope, $element) {
        $element[0].addEventListener('click', () => {
          console.log('clicked');
        }, false);
      };
    }
  };
}]);

app.directive('dlgtClick', () => ({
    compile($element, $attrs) {
      // We don't setup the global event listeners as the costs are small and one time only...
    }
  }));

app.controller('DataController', function DataController($rootScope) {
  this.ngRepeatCount = 1000;
  this.rows = [];
  const self = this;

  benchmarkSteps.push({
    name: '$apply',
    fn() {
      const oldRows = self.rows;
      $rootScope.$apply(() => {
        self.rows = [];
      });
      self.rows = oldRows;
      if (self.rows.length !== self.ngRepeatCount) {
        self.rows = [];
        for (let i = 0; i < self.ngRepeatCount; i++) {
          self.rows.push(`row${  i}`);
        }
      }
      $rootScope.$apply();
    }
  });
});
