import { dealoc, jqLite } from "../../shared/jqlite/jqlite";
import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";

describe("ngClick", () => {
  let element;
  let $compile;
  let $rootScope;
  let injector;

  beforeEach(() => {
    publishExternalAPI();
    injector = createInjector(["ng"]);
    $compile = injector.get("$compile");
    $rootScope = injector.get("$rootScope");
  });

  afterEach(() => {
    dealoc(element);
    jqLite.CACHE.clear();
  });

  it("should get called on a click", () => {
    element = $compile('<div ng-click="clicked = true"></div>')($rootScope);
    $rootScope.$digest();
    expect($rootScope.clicked).toBeFalsy();

    element[0].click();
    expect($rootScope.clicked).toEqual(true);
  });

  it("should pass event object", () => {
    element = $compile('<div ng-click="event = $event"></div>')($rootScope);
    $rootScope.$digest();

    element[0].click();
    expect($rootScope.event).toBeDefined();
  });
});
