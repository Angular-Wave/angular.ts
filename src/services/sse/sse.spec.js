import { Angular } from "../../angular.js";
import { dealoc } from "../../shared/dom.js";
import { wait } from "../../shared/test-utils.js";

describe("$sse", () => {
  let sse, sseProvider, el, $compile, $scope;

  beforeEach(() => {
    el = document.getElementById("app");
    el.innerHTML = "";
    let angular = new Angular();
    angular.module("default", []).config(($sseProvider) => {
      sseProvider = $sseProvider;
    });
    angular
      .bootstrap(el, ["default"])
      .invoke((_$sse_, _$compile_, _$rootScope_) => {
        sse = _$sse_;
        $compile = _$compile_;
        $scope = _$rootScope_;
      });
  });

  afterEach(() => {
    dealoc(el);
  });

  it("should be available as provider", () => {
    expect(sseProvider).toBeDefined();
  });

  it("should be available as a serviceprovider", () => {
    expect(sse).toBeDefined();
  });
});
