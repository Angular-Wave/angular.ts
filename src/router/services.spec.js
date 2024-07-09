import { Angular } from "../../loader";
import { publishExternalAPI } from "../../public";

describe("router services", () => {
  let providers;
  let $injector;

  beforeEach(() => {
    window.angular = new Angular();
    publishExternalAPI();
    let module = window.angular.module("defaultModule", ["ng.router"]);
    module.config(
      (
        $urlServiceProvider,
        $stateRegistryProvider,
        $routerGlobalsProvider,
        $transitionsProvider,
        $stateProvider,
      ) => {
        providers = {
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
    expect(providers.$urlServiceProvider).toBeDefined();
    expect(providers.$stateRegistryProvider).toBeDefined();
    expect(providers.$stateRegistryProvider).toBeDefined();
    expect(providers.$transitionsProvider).toBeDefined();
    expect(providers.$stateProvider).toBeDefined();
  });

  it("Should expose ui-router services from the UIRouter instance", () => {
    expect($injector.get("$urlService")).toBeDefined();
    expect($injector.get("$stateRegistry")).toBeDefined();
    expect($injector.get("$routerGlobals")).toBeDefined();
    expect($injector.get("$transitions")).toBeDefined();
    expect($injector.get("$state")).toBeDefined();
    expect($injector.get("$stateParams")).toBeDefined();
    expect($injector.get("$view")).toBeDefined();
    expect($injector.get("$trace")).toBeDefined();
  });
});
