

const app = angular.module('ngClassBenchmark', []);

app.controller('DataController', function DataController($scope) {

  this.init = function() {
    this.numberOfTodos = 1000;
    this.implementation = 'tableOptimized';
    this.completedPeriodicity = 3;
    this.importantPeriodicity = 13;
    this.urgentPeriodicity = 29;

    this.createTodos(100);
    this.setTodosValuesWithSeed(0);
  };

  this.clearTodos = function() {
    this.todos = null;
  };

  this.createTodos = function(count) {
    let i;
    this.todos = [];
    for (i = 0; i < count; i++) {
      this.todos.push({
        id: i + 1,
        completed: false,
        important: false,
        urgent: false
      });
    }
  };

  this.setTodosValuesWithSeed = function(offset) {
    let i; let todo;
    for (i = 0; i < this.todos.length; i++) {
      todo = this.todos[i];
      todo.completed = (i + offset) % this.completedPeriodicity === 0;
      todo.important = (i + offset) % this.importantPeriodicity === 0;
      todo.urgent = (i + offset) % this.urgentPeriodicity === 0;
    }
  };

  this.init();


  benchmarkSteps.push({
    name: 'setup',
    fn: function() {
      $scope.$apply();
      this.clearTodos();
      this.createTodos(this.numberOfTodos);
    }.bind(this)
  });

  benchmarkSteps.push({
    name: 'create',
    fn: function() {
      // initialize data for first time that will construct the DOM
      this.setTodosValuesWithSeed(0);
      $scope.$apply();
    }.bind(this)
  });

  benchmarkSteps.push({
    name: '$apply',
    fn() {
      $scope.$apply();
    }
  });

  benchmarkSteps.push({
    name: 'update',
    fn: function() {
      // move everything but completed
      this.setTodosValuesWithSeed(3);
      $scope.$apply();
    }.bind(this)
  });

  benchmarkSteps.push({
    name: 'unclass',
    fn: function() {
      // remove all classes
      this.setTodosValuesWithSeed(NaN);
      $scope.$apply();
    }.bind(this)
  });

  benchmarkSteps.push({
    name: 'class',
    fn: function() {
      // add all classes as the initial state
      this.setTodosValuesWithSeed(0);
      $scope.$apply();
    }.bind(this)
  });

  benchmarkSteps.push({
    name: 'destroy',
    fn: function() {
      this.clearTodos();
      $scope.$apply();
    }.bind(this)
  });

});
