import { Angular } from "../../loader.js";
import { createInjector } from "../../core/di/injector.js";
import { dealoc } from "../../shared/dom.js";

describe("ngSrcset", () => {
  let $scope;
  let $compile;
  let element;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular.module("myModule", ["ng"]);
    createInjector(["myModule"]).invoke(($rootScope, _$compile_) => {
      $scope = $rootScope.$new();
      $compile = _$compile_;
    });
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should not result empty string in img srcset", () => {
    $scope.image = {};
    element = $compile('<img ng-srcset="{{image.url}} 2x">')($scope);
    expect(element.getAttribute("ng-srcset")).toBeNull();
  });

  it("should sanitize good urls", () => {
    $scope.imageUrl =
      "http://example.com/image1.png 1x, http://example.com/image2.png 2x";
    element = $compile('<img ng-srcset="{{imageUrl}}">')($scope);
    expect(element.getAttribute("ng-srcset")).toBe(
      "http://example.com/image1.png 1x,http://example.com/image2.png 2x",
    );
  });

  it("should sanitize evil url", () => {
    $scope.imageUrl =
      "http://example.com/image1.png 1x, javascript:doEvilStuff() 2x";
    element = $compile('<img ng-srcset="{{imageUrl}}">')($scope);
    expect(element.getAttribute("ng-srcset")).toBe(
      "http://example.com/image1.png 1x,unsafe:javascript:doEvilStuff() 2x",
    );
  });

  it("should not throw an error if undefined", () => {
    element = $compile('<img ng-attr-srcset="{{undefined}}">')($scope);
  });

  it("should interpolate the expression and bind to srcset", () => {
    const element = $compile('<img ng-srcset="some/{{id}} 2x"></div>')($scope);

    expect(element.getAttribute("ng-srcset")).toBeNull();

    $scope.$apply(() => {
      $scope.id = 1;
    });
    expect(element.getAttribute("ng-srcset")).toEqual("some/1 2x");

    dealoc(element);
  });
});
