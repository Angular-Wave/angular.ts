import { Angular } from "../../loader.js";
import { dealoc } from "../../shared/dom.js";
import { wait } from "../../shared/test-utils.js";

describe("setter", () => {
  let $compile, $rootScope, $parse, observerSpy, $log;

  beforeEach(() => {
    dealoc(document.getElementById("app"));
    window.angular = new Angular();
    angular.module("myModule", []);
    angular
      .bootstrap(document.getElementById("app"), ["myModule"])
      .invoke((_$compile_, _$rootScope_, _$parse_, _$log_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $parse = _$parse_;
        $log = _$log_;
      });
    observerSpy = jasmine.createSpyObj("MutationObserver", [
      "observe",
      "disconnect",
    ]);
  });

  it("should update the scope model when the element content changes", async () => {
    $rootScope.testModel = "";
    const element = $compile('<div ng-setter="testModel"></div>')($rootScope);
    await wait();

    element.innerHTML = "New content";
    await wait();

    expect($rootScope.testModel).toBe("New content");
  });

  it("should handle initial content in the element", async () => {
    $rootScope.testModel = "";
    const element = $compile(
      '<div ng-setter="testModel">Initial content</div>',
    )($rootScope);
    await wait();

    expect($rootScope.testModel).toBe("Initial content");
  });

  it("should warn if no model expression is provided", async () => {
    spyOn($log, "warn");

    $compile("<div ng-setter></div>")($rootScope);
    await wait();

    expect($log.warn).toHaveBeenCalledWith(
      "ngSetter: Model expression is not provided.",
    );
  });

  it("should clean up the MutationObserver on scope destruction", async () => {
    spyOn(window, "MutationObserver").and.returnValue(observerSpy);
    const element = $compile('<div ng-setter="testModel"></div>')($rootScope);

    $rootScope.$destroy();
    await wait();
    expect(observerSpy.disconnect).toHaveBeenCalled();
  });

  it("should gracefully handle invalid DOM elements", async () => {
    spyOn(console, "warn");

    const element = $compile("<div></div>")($rootScope);
    await wait();

    expect(console.warn).not.toHaveBeenCalledWith(
      "ngSetter: Element is not a valid DOM node.",
    );
  });
});
