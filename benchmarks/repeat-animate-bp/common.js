

(function() {
  const app = angular.module('repeatAnimateBenchmark');

  app.config(($compileProvider, $animateProvider) => {
    if ($compileProvider.debugInfoEnabled) {
      $compileProvider.debugInfoEnabled(false);
    }

  });

  app.run(($animate) => {
    if ($animate.enabled) {
      $animate.enabled(true);
    }
  });

  app.controller('DataController', ($scope, $rootScope, $animate) => {
    const totalRows = 500;
    const totalColumns = 20;

    let data = $scope.data = [];

    function fillData() {
      if ($animate.enabled) {
        $animate.enabled($scope.benchmarkType !== 'globallyDisabled');
      }

      for (let i = 0; i < totalRows; i++) {
        data[i] = [];
        for (let j = 0; j < totalColumns; j++) {
          data[i][j] = {
            i
          };
        }
      }
    }

    benchmarkSteps.push({
      name: 'enter',
      fn() {
        $scope.$apply(() => {
          fillData();
        });
      }
    });

    benchmarkSteps.push({
      name: 'leave',
      fn() {
        $scope.$apply(() => {
          data = $scope.data = [];
        });
      }
    });
  });

  app.directive('disableAnimations', ($animate) => ({
      link: {
        pre(s, e) {
          $animate.enabled(e, false);
        }
      }
    }));

  app.directive('noop', ($animate) => ({
      link: {
        pre: () => {}
      }
    }));

  app.directive('baseline', ($document) => ({
      restrict: 'E',
      link($scope, $element) {
        const document = $document[0];

        let i; let j; let row; let cell; let comment;
        const template = document.createElement('span');
        template.setAttribute('ng-repeat', 'foo in foos');
        template.classList.add('ng-scope');
        template.appendChild(document.createElement('span'));
        template.appendChild(document.createTextNode(':'));

        function createList() {
          for (i = 0; i < $scope.data.length; i++) {
            row = document.createElement('div');
            $element[0].appendChild(row);
            for (j = 0; j < $scope.data[i].length; j++) {
              cell = template.cloneNode(true);
              row.appendChild(cell);
              cell.childNodes[0].textContent = i;
              cell.ng339 = 'xxx';
              comment = document.createComment('ngRepeat end: bar in foo');
              row.appendChild(comment);
            }

            comment = document.createComment('ngRepeat end: foo in foos');
            $element[0].appendChild(comment);
          }
        }

        $scope.$watch('data.length', (newVal) => {
          if (newVal === 0) {
            while ($element[0].firstChild) {
                $element[0].removeChild($element[0].firstChild);
            }
          } else {
            createList();
          }
        });
      }
    }));
})();
