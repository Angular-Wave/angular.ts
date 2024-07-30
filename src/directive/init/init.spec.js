import { dealoc, JQLite } from "../../shared/jqlite/jqlite";
import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";
import { Angular, setupModuleLoader } from "../../loader";

describe("ngInit", () => {
  let element;
  let $rootScope;
  let $compile;
  let $templateCache;
  let angular;
  let injector;

  beforeEach(() => {
    angular = new Angular();
    publishExternalAPI();
    injector = createInjector(["ng"]);
    $rootScope = injector.get("$rootScope");
    $compile = injector.get("$compile");
    $templateCache = injector.get("$templateCache");
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should init model", () => {
    element = $compile('<div ng-init="a=123"></div>')($rootScope);
    expect($rootScope.a).toEqual(123);
  });

  it("should be evaluated before ngInclude", (done) => {
    element = JQLite(
      '<div><div ng-include="template" ' +
        "ng-init=\"template='template2.tpl'\"></div></div>",
    );
    window.angular.module("myModule", []).run(($templateCache) => {
      $templateCache.put("template1.tpl", "<span>1</span>");
      $templateCache.put("template2.tpl", "<span>2</span>");
    });
    injector = angular.bootstrap(element, ["myModule"]);
    $rootScope = injector.get("$rootScope");
    $rootScope.$digest();
    expect($rootScope.template).toEqual("template2.tpl");
    setTimeout(() => {
      expect(element.find("span").text()).toEqual("2");
      done();
    }, 10);
  });

  it("should be evaluated after ngController", () => {
    window.angular.module("test1", ["ng"]);
    createInjector([
      "ng",
      ($controllerProvider) => {
        $controllerProvider.register("TestCtrl", ($scope) => {});
      },
    ]).invoke(($rootScope, $compile) => {
      element = $compile(
        '<div><div ng-controller="TestCtrl" ' +
          'ng-init="test=123"></div></div>',
      )($rootScope);
      $rootScope.$digest();
      expect($rootScope.test).toBeUndefined();
      expect($rootScope.$$childHead.test).toEqual(123);
    });
  });
});
