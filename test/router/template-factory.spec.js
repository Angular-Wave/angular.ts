import { dealoc, jqLite } from "../../src/jqLite";
import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";
import { wait } from "../test-utils";

describe("templateFactory", () => {
  let $injector, $templateFactory, $httpBackend, $sce, $scope, $compile;

  beforeEach(() => {
    dealoc(document.getElementById("dummy"));
    window.angular = new Angular();
    publishExternalAPI();
    window.angular.module("defaultModule", ["ng.router"]);
    $injector = window.angular.bootstrap(document.getElementById("dummy"), [
      "defaultModule",
    ]);
    $injector.invoke(
      (_$templateFactory_, _$httpBackend_, _$sce_, $rootScope) => {
        ($templateFactory = _$templateFactory_),
          ($httpBackend = _$httpBackend_),
          ($sce = _$sce_);
        $scope = $rootScope;
      },
    );
  });

  it("exists", () => {
    expect($injector.get("$templateFactory")).toBeDefined();
  });

  describe("should follow $sce policy and", () => {
    it("accepts relative URLs", async () => {
      let res = $templateFactory.fromUrl("mock/hello");
      $scope.$digest();
      await wait(100);
      expect(res.$$state.status).toBe(1);
    });

    it("rejects untrusted URLs", () => {
      let error = "No error thrown";
      try {
        $templateFactory.fromUrl("http://evil.com/views/view.html");
      } catch (e) {
        error = e.message;
      }
      expect(error).toMatch(/sce:insecurl/);
    });

    it("accepts explicitly trusted URLs", () => {
      expect(() => {
        $templateFactory.fromUrl(
          $sce.trustAsResourceUrl("http://evil.com/views/view.html"),
        );
      }).not.toThrowError();
    });
  });

  describe("templateFactory with forced use of $http service", () => {
    beforeEach(() => {
      dealoc(document.getElementById("dummy"));
      let module = window.angular.module("defaultModule", ["ng.router"]);
      module.config(function ($templateFactoryProvider) {
        $templateFactoryProvider.useHttpService(true);
      });
      $injector = window.angular.bootstrap(document.getElementById("dummy"), [
        "defaultModule",
      ]);
      $injector.invoke(
        (_$templateFactory_, _$httpBackend_, _$sce_, $rootScope) => {
          ($templateFactory = _$templateFactory_),
            ($httpBackend = _$httpBackend_),
            ($sce = _$sce_);
          $scope = $rootScope;
        },
      );
    });

    it("does not restrict URL loading", function () {
      expect(() => {
        $templateFactory.fromUrl("http://evil.com/views/view.html");
      }).not.toThrowError();

      expect(() => {
        $templateFactory.fromUrl("data:text/html,foo");
      }).not.toThrowError();
    });
  });

  describe("component template builder", () => {
    let $router, el;

    beforeEach(() => {
      dealoc(document.getElementById("dummy"));
      const mod = angular.module("defaultModule", ["ng.router"]);
      mod.component("myComponent", { template: "hi" });
      mod.component("dataComponent", { template: "hi" });
      mod.component("xComponent", { template: "hi" });
      $injector = window.angular.bootstrap(document.getElementById("dummy"), [
        "defaultModule",
      ]);
      $injector.invoke(
        (
          _$templateFactory_,
          _$httpBackend_,
          _$sce_,
          $rootScope,
          _$router_,
          _$compile_,
        ) => {
          ($templateFactory = _$templateFactory_),
            ($httpBackend = _$httpBackend_),
            ($sce = _$sce_);
          $scope = $rootScope;
          $router = _$router_;
          $compile = _$compile_;
        },
      );
      el = $compile(jqLite("<div><ng-view></ng-view></div>"))($scope.$new());
    });

    it("should not prefix the components dom element with anything", async () => {
      $router.stateRegistry.register({ name: "cmp", component: "myComponent" });
      $router.stateService.go("cmp");
      $scope.$digest();
      await wait(100);
      expect(el.html()).toMatch(/\<my-component/);
    });

    it("should prefix the components dom element with x- for components named dataFoo", () => {
      $router.stateRegistry.register({
        name: "cmp",
        component: "dataComponent",
      });
      $router.stateService.go("cmp");
      $scope.$digest();
      expect(el.html()).toMatch(/\<x-data-component/);
    });

    it("should prefix the components dom element with x- for components named xFoo", () => {
      $router.stateRegistry.register({ name: "cmp", component: "xComponent" });
      $router.stateService.go("cmp");
      $scope.$digest();
      expect(el.html()).toMatch(/\<x-x-component/);
    });
  });
});
