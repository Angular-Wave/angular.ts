import { dealoc } from "../../shared/dom.js";
import { Angular } from "../../loader.js";
import { createInjector } from "../../core/di/injector.js";

describe("ngClick", () => {
  let element;
  let $compile;
  let $rootScope;
  let injector;

  beforeEach(() => {
    window.angular = new Angular();
    injector = createInjector(["ng"]);
    $compile = injector.get("$compile");
    $rootScope = injector.get("$rootScope");
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should get called on a click", () => {
    element = $compile('<div ng-click="clicked = true"></div>')($rootScope);
    expect($rootScope.clicked).toBeFalsy();

    element.click();
    expect($rootScope.clicked).toEqual(true);
  });

  it("should pass event object", () => {
    element = $compile('<div ng-click="event = $event"></div>')($rootScope);
    element.click();
    expect($rootScope.event).toBeDefined();
  });
});
