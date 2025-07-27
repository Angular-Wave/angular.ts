import { Angular } from "../loader.js";
import { dealoc } from "../shared/dom.js";

describe("router services", () => {
  let providers;
  let $injector;

  beforeEach(() => {
    dealoc(document.getElementById("app"));
    window["angular"] = new Angular();
    let module = window["angular"].module("defaultModule", []);
    module.config(
      (
        $urlProvider,
        $stateRegistryProvider,
        $routerGlobalsProvider,
        $transitionsProvider,
        $stateProvider,
      ) => {
        providers = {
          $urlProvider,
          $stateRegistryProvider,
          $routerGlobalsProvider,
          $transitionsProvider,
          $stateProvider,
        };
      },
    );

    $injector = window["angular"].bootstrap(document.getElementById("app"), [
      "defaultModule",
    ]);
  });

  it("Should expose ng-router providers from the UIRouter instance", () => {
    expect(providers.$urlProvider).toBeDefined();
    expect(providers.$stateRegistryProvider).toBeDefined();
    expect(providers.$stateRegistryProvider).toBeDefined();
    expect(providers.$transitionsProvider).toBeDefined();
    expect(providers.$stateProvider).toBeDefined();
  });

  it("Should expose ng-router services from the UIRouter instance", () => {
    expect($injector.get("$url")).toBeDefined();
    expect($injector.get("$stateRegistry")).toBeDefined();
    expect($injector.get("$routerGlobals")).toBeDefined();
    expect($injector.get("$transitions")).toBeDefined();
    expect($injector.get("$state")).toBeDefined();
    expect($injector.get("$stateParams")).toBeDefined();
    expect($injector.get("$view")).toBeDefined();
    expect($injector.get("$trace")).toBeDefined();
  });
});
