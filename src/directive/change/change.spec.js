import { createInjector } from "../../core/di/injector.js";
import { dealoc } from "../../shared/dom.js";
import { Angular } from "../../loader.js";
import { wait } from "../../shared/test-utils.js";

describe("ngChange", () => {
  let injector;
  let el;

  beforeEach(() => {
    window.angular = new Angular();
    injector = createInjector(["ng"]);
  });

  afterEach(() => dealoc(el));

  it("should $eval expression after new value is set in the model", () => {
    injector.invoke(($compile, $rootScope) => {
      el = $compile(
        '<input type="text" ng-model="value" ng-change="change()" />',
      )($rootScope);

      $rootScope.change = jasmine.createSpy("change").and.callFake(() => {
        expect($rootScope.value).toBe("new value");
      });

      el.setAttribute("value", "new value");
      el.dispatchEvent(new Event("change"));

      expect($rootScope.change).toHaveBeenCalled();
    });
  });

  it("should not $eval the expression if changed from model", () => {
    injector.invoke(($compile, $rootScope) => {
      el = $compile(
        '<input type="text" ng-model="value" ng-change="change()" />',
      )($rootScope);

      $rootScope.change = jasmine.createSpy("change");
      $rootScope.$apply("value = true");

      expect($rootScope.change).not.toHaveBeenCalled();
    });
  });

  it("should $eval ngChange expression on checkbox", () => {
    injector.invoke(($compile, $rootScope) => {
      el = $compile(
        '<input type="checkbox" ng-model="foo" ng-change="changeFn()">',
      )($rootScope);

      $rootScope.changeFn = jasmine.createSpy("changeFn");
      expect($rootScope.changeFn).not.toHaveBeenCalled();

      el.dispatchEvent(new Event("change"));
      expect($rootScope.changeFn).toHaveBeenCalled();
    });
  });

  it("should be able to change the model and via that also update the view", () => {
    injector.invoke(async ($compile, $rootScope) => {
      el = $compile(
        '<input type="text" ng-model="value" ng-change="value=\'b\'" />',
      )($rootScope);

      el.setAttribute("value", "a");
      el.dispatchEvent(new Event("change"));
      await wait();
      expect(el.value).toBe("b");
    });

    expect(el.value).toBe("a");
  });
});
