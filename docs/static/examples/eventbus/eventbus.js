angular.module("demo", [])
    .controller("DemoCtrl", class DemoCtrl {
        constructor($eventBus, $scope) {
            $eventBus.subscribe("demo", (val) => {
                // `this` is not a proxy so we have to access our controller as a scope property
                $scope.$ctrl.ms = val;
            });
        }
    });

    