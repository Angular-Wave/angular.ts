import { createInjector } from "../../src/injector";
import { dealoc } from "../../src/jqLite";
import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";
import { StateProvider } from "../../src/router/stateProvider";

describe("$state", () => {
  let $uiRouter,
    $injector,
    locationProvider,
    templateParams,
    template,
    ctrlName,
    errors,
    module;

  /** @type {import("../../src/router/stateProvider").StateProvider} */
  let $stateProvider;

  beforeEach(() => {
    window.angular = new Angular();
    publishExternalAPI();
    module = window.angular.module("defaultModule", ["ui.router"]);
    module.config((_$stateProvider_) => {
      $stateProvider = _$stateProvider_;
    });
    angular.bootstrap(document.getElementById("dummy"), ["defaultModule"]);
  });

  afterEach(() => {
    dealoc(document.getElementById("dummy"));
  });

  describe("provider", () => {
    it("should be available at config", () => {
      expect($stateProvider).toBeDefined();
    });

    it("should should not allow states that are already registerred", () => {
      expect(() => {
        $stateProvider.state({ name: "toString", url: "/to-string" });
      }).not.toThrow();
      expect(() => {
        $stateProvider.state({ name: "toString", url: "/to-string" });
      }).toThrowError(/stateinvalid/);
    });

    it("should should not allow states that have invalid keys", () => {
      expect(() => {
        debugger;
        $stateProvider.state({ name: "faulty", faulturl: "/to-string" });
      }).toThrowError(/stateinvalid/);
    });

    it("should requred `name` if state definition object is passed", () => {
      expect(() => {
        $stateProvider.state({ url: "/to-string" });
      }).toThrowError(/stateinvalid/);
      expect(() => {
        $stateProvider.state({ name: "hasName", url: "/to-string" });
      }).not.toThrowError(/stateinvalid/);
    });
  });
});
