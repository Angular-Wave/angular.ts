import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";

describe("router services", () => {
  let providers;
  let $routerProvider;
  let $injector;

  beforeEach(() => {
    window.angular = new Angular();
    publishExternalAPI();
    let module = window.angular.module("defaultModule", ["ui.router"]);
    module.config(
      (
        _$routerProvider_,
        $urlMatcherFactoryProvider,
        $stateRegistryProvider,
        $routerGlobalsProvider,
        $transitionsProvider,
        $stateProvider,
      ) => {
        $routerProvider = _$routerProvider_;
        expect($routerProvider["router"]).toBe($routerProvider);
        providers = {
          $routerProvider,
          $urlMatcherFactoryProvider,
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
    expect(providers.$urlMatcherFactoryProvider).toBe(
      $routerProvider.urlMatcherFactory,
    );
    expect(providers.$urlRouterProvider).toBe(
      $routerProvider.urlRouterProvider,
    );
    expect(providers.$stateRegistryProvider).toBe(
      $routerProvider.stateRegistry,
    );
    expect(providers.$routerGlobalsProvider).toBe($routerProvider.globals);
    expect(providers.$transitionsProvider).toBe(
      $routerProvider.transitionService,
    );
    expect(providers.$stateProvider).toBe($routerProvider.stateProvider);
  });

  it("Should expose ui-router services from the UIRouter instance", () => {
    let $router = $injector.get("$router");
    expect($router).toBe($routerProvider);
    expect($injector.get("$urlMatcherFactory")).toBe($router.urlMatcherFactory);
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
