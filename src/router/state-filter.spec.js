import { Angular } from "../loader.js";

describe("router filters", function () {
  let module, $parse, $state, $rootScope, $location;

  beforeEach(() => {
    window.location.hash = "";
    window.angular = new Angular();
  });

  afterEach(() => (window.location.hash = ""));

  describe("isState filter", () => {
    beforeEach(() => {
      window.location.hash = "";
      module = window.angular.module("defaultModule", []);
      module.config(function ($stateProvider) {
        $stateProvider
          .state({ name: "a", url: "/" })
          .state({ name: "a.b", url: "/b" })
          .state({ name: "with-param", url: "/with/:param" });
      });
      let $injector = window.angular.bootstrap(document.getElementById("app"), [
        "defaultModule",
      ]);

      $injector.invoke(
        (
          _$parse_,
          _$state_,
          _$rootScope_,
          _$transitions_,
          _$location_,
          _$compile_,
        ) => {
          $parse = _$parse_;
          $state = _$state_;
          $rootScope = _$rootScope_;
          $location = _$location_;
        },
      );
    });
    it("should return true if the current state exactly matches the input state", async () => {
      await $state.go("a");
      expect($parse('"a" | isState')($rootScope)).toBe(true);
    });

    it("should return false if the current state does not exactly match the input state", async () => {
      await $state.go("a.b");
      expect($parse('"a" | isState')($rootScope)).toBe(false);
    });

    it("should return true if the current state and param matches the input state", async () => {
      await $state.go("with-param", { param: "a" });

      expect($parse('"with-param" | isState: {param: "a"}')($rootScope)).toBe(
        true,
      );
    });

    it("should return false if the current state and param does not match the input state", async () => {
      await $state.go("with-param", { param: "b" });

      expect($parse('"with-param" | isState: {param: "a"}')($rootScope)).toBe(
        false,
      );
    });
  });

  describe("includedByState filter", function () {
    beforeEach(() => {
      module = window.angular.module("defaultModule", []);
      module.config(function ($stateProvider) {
        $stateProvider
          .state({ name: "a", url: "/" })
          .state({ name: "a.b", url: "/b" })
          .state({ name: "c", url: "/c" })
          .state({ name: "d", url: "/d/:id" });
      });

      let $injector = window.angular.bootstrap(document.getElementById("app"), [
        "defaultModule",
      ]);

      $injector.invoke(
        (
          _$parse_,
          _$state_,
          _$rootScope_,
          _$transitions_,
          _$location_,
          _$compile_,
        ) => {
          $parse = _$parse_;
          $state = _$state_;
          $rootScope = _$rootScope_;
          $location = _$location_;
        },
      );
    });

    afterEach(() => (window.location.hash = ""));

    it("should return true if the current state exactly matches the input state", async () => {
      await $state.go("a");

      expect($parse('"a" | includedByState')($rootScope)).toBe(true);
    });

    it("should return true if the current state includes the input state", async () => {
      await $state.go("a.b");

      expect($parse('"a" | includedByState')($rootScope)).toBe(true);
    });

    it("should return false if the current state does not include input state", async () => {
      await $state.go("c");

      expect($parse('"a" | includedByState')($rootScope)).toBe(false);
    });

    it("should return true if the current state include input state and params", async () => {
      await $state.go("d", { id: 123 });

      expect($parse('"d" | includedByState:{ id: 123 }')($rootScope)).toBe(
        true,
      );
    });

    it("should return false if the current state does not include input state and params", async () => {
      await $state.go("d", { id: 2377 });

      expect($parse('"d" | includedByState:{ id: 123 }')($rootScope)).toBe(
        false,
      );
    });
  });
});
