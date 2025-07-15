import { Angular } from "../../loader.js";
import { dealoc } from "../../shared/dom.js";
// import { browserTrigger, wait } from "../../shared/test-utils.js";

describe("ngPut", () => {
  let $compile, $rootScope, $httpBackend, el;

  beforeEach(() => {
    el = document.getElementById("app");
    dealoc(el);
    el.innerHTML = "";
    let angular = new Angular();
    angular.module("default", []);
    angular
      .bootstrap(el, ["default"])
      .invoke((_$compile_, _$rootScope_, _$httpBackend_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
      });
  });

  it("should pass", () => {
    expect(true).toBeTrue();
  });
});
