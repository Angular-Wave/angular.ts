import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";

describe("router services", () => {
  let providers;
  let $routerProvider;
  let $injector;

  beforeEach(() => {
    window.angular = new Angular();
    publishExternalAPI();
    let module = window.angular.module("defaultModule", ["ng.router"]);
    module.config(
      (
        _$routerProvider_,
        $urlServiceProvider,
        $stateRegistryProvider,
        $routerGlobalsProvider,
        $transitionsProvider,
        $stateProvider,
      ) => {
        $routerProvider = _$routerProvider_;
        expect($routerProvider["router"]).toBe($routerProvider);
        providers = {
          $routerProvider,
          $urlServiceProvider,
          $stateRegistryProvider,
          $routerGlobalsProvider,
          $transitionsProvider,
          $stateProvider,
        };
      },
    );

    $injector = window.angular.bootstrap(document.getElementById("dummy"), [
      "defaultModule",
    ]);
  });

  it("Should expose ui-router providers from the UIRouter instance", () => {
    expect(providers.$routerProvider).toBeDefined();
    expect(providers.$urlServiceProvider).toBeDefined();
    expect(providers.$stateRegistryProvider).toBeDefined();
    expect(providers.$stateRegistryProvider).toBeDefined();
    expect(providers.$transitionsProvider).toBeDefined();
    expect(providers.$stateProvider).toBeDefined();
  });

  it("Should expose ui-router services from the UIRouter instance", () => {
    let $router = $injector.get("$router");
    expect($router).toBe($routerProvider);
    expect($injector.get("$urlService")).toBe($router.urlService);
    expect($injector.get("$stateRegistry")).toBe($router.stateRegistry);
    expect($injector.get("$routerGlobals")).toBe($router.globals);
    expect($injector.get("$transitions")).toBe($router.transitionService);
    expect($injector.get("$state")).toBe($router.stateService);
    expect($injector.get("$stateParams")).toBe($router.globals.params);
    expect($injector.get("$view")).toBe($router.viewService);
    expect($injector.get("$trace")).toBeDefined();
  });
});
