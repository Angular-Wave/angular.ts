import { Angular } from "../../loader";
import { createInjector } from "../../core/di/injector";
import { dealoc, JQLite } from "../../shared/jqlite/jqlite.js";
import { bind } from "../../shared/utils.js";

describe("ngController", () => {
  let angular;
  let element;
  let injector;
  let $rootScope;
  let $compile;

  const Greeter = function ($scope) {
    // private stuff (not exported to scope)
    this.prefix = "Hello ";

    // public stuff (exported to scope)
    const ctrl = this;
    $scope.name = "Misko";
    $scope.expr = "Vojta";
    $scope.greet = function (name) {
      return ctrl.prefix + name + ctrl.suffix;
    };

    $scope.protoGreet = bind(this, this.protoGreet);
  };
  Greeter.prototype = {
    suffix: "!",
    protoGreet(name) {
      return this.prefix + name + this.suffix;
    },
  };

  beforeEach(() => {
    angular = new Angular();
    window.angular = new Angular();
    injector = createInjector([
      "ng",
      ($controllerProvider) => {
        $controllerProvider.register("PublicModule", function () {
          this.mark = "works";
        });
        $controllerProvider.register("Greeter", Greeter);

        $controllerProvider.register("Child", ($scope) => {
          $scope.name = "Adam";
        });

        $controllerProvider.register("Public", function ($scope) {
          this.mark = "works";
        });

        const Foo = function ($scope) {
          $scope.mark = "foo";
        };
        $controllerProvider.register("BoundFoo", ["$scope", Foo.bind(null)]);
      },
    ]).invoke((_$rootScope_, _$compile_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should instantiate controller and bind methods", () => {
    element = $compile('<div ng-controller="Greeter">{{greet(name)}}</div>')(
      $rootScope,
    );
    $rootScope.$digest();
    expect(element.text()).toBe("Hello Misko!");
  });

  it("should instantiate bound constructor functions", () => {
    element = $compile('<div ng-controller="BoundFoo">{{mark}}</div>')(
      $rootScope,
    );
    $rootScope.$digest();
    expect(element.text()).toBe("foo");
  });

  it("should publish controller into scope", () => {
    element = $compile('<div ng-controller="Public as p">{{p.mark}}</div>')(
      $rootScope,
    );
    $rootScope.$digest();
    expect(element.text()).toBe("works");
  });

  it("should publish controller into scope from module", () => {
    element = $compile(
      '<div ng-controller="PublicModule as p">{{p.mark}}</div>',
    )($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe("works");
  });

  it("should allow nested controllers", () => {
    element = $compile(
      '<div ng-controller="Greeter"><div ng-controller="Child">{{greet(name)}}</div></div>',
    )($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe("Hello Adam!");
    dealoc(element);

    element = $compile(
      '<div ng-controller="Greeter"><div ng-controller="Child">{{protoGreet(name)}}</div></div>',
    )($rootScope);
    $rootScope.$digest();
    expect(element.text()).toBe("Hello Adam!");
  });

  it("should work with ngInclude on the same element", (done) => {
    element = JQLite(
      '<div><div ng-controller="Greeter" ng-include="\'/mock/interpolation\'"></div></div>',
    );
    window.angular
      .module("myModule", [])
      .controller("Greeter", function GreeterController($scope) {
        $scope.expr = "Vojta";
      });

    injector = angular.bootstrap(element, ["myModule"]);

    $rootScope = injector.get("$rootScope");
    $rootScope.$digest();
    setTimeout(() => {
      expect(element.text()).toEqual("Vojta");
      dealoc($rootScope);
      done();
    }, 200);
  });

  it("should only instantiate the controller once with ngInclude on the same element", () => {
    let count = 0;

    element = JQLite(
      '<div><div ng-controller="Count" ng-include="\'/mock/interpolation\'"></div></div>',
    );
    window.angular
      .module("myModule", [])
      .controller("Count", function CountController($scope) {
        count += 1;
      });

    injector = angular.bootstrap(element, ["myModule"]);

    $rootScope = injector.get("$rootScope");

    $rootScope.expr = "first";
    $rootScope.$digest();

    $rootScope.expr = "second";
    $rootScope.$digest();

    expect(count).toBe(1);
  });

  it("when ngInclude is on the same element, the content included content should get a child scope of the controller", () => {
    let controllerScope;

    element = JQLite(
      '<div><div ng-controller="ExposeScope" ng-include="\'/mock/scopeinit\'"></div></div>',
    );

    window.angular
      .module("myModule", [])
      .controller("ExposeScope", function ExposeScopeController($scope) {
        controllerScope = $scope;
      });

    injector = angular.bootstrap(element, ["myModule"]);

    $rootScope = injector.get("$rootScope");
    $rootScope.$digest();

    expect(controllerScope.name).toBeUndefined();
  });
});
