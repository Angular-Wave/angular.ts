import { Angular } from "../../loader.js";
import { wait } from "../../shared/test-utils.js";

describe("setter", () => {
  let $compile, $rootScope, $parse, observerSpy;

  beforeEach(() => {
    window.angular = new Angular();
    angular.module("myModule", ["ng"]);
    angular
      .bootstrap(document.getElementById("dummy"), ["myModule"])
      .invoke((_$compile_, _$rootScope_, _$parse_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $parse = _$parse_;
      });
    observerSpy = jasmine.createSpyObj("MutationObserver", [
      "observe",
      "disconnect",
    ]);
  });

  it("should update the scope model when the element content changes", async () => {
    const element = $compile('<div ng-setter="testModel"></div>')($rootScope);
    $rootScope.$digest();

    element.html("New content");
    await wait();
    $rootScope.$digest();

    expect($rootScope.testModel).toBe("New content");
  });

  it("should update the scope model for objects when the element content changes", async () => {
    const element = $compile('<div ng-setter="testModel.a">1</div>')(
      $rootScope,
    );
    $rootScope.$digest();

    element.html("New content");
    await wait();
    $rootScope.$digest();

    expect($rootScope.testModel.a).toBe("New content");
  });

  it("should handle initial content in the element", () => {
    $compile('<div ng-setter="testModel">Initial content</div>')($rootScope);
    $rootScope.$digest();

    expect($rootScope.testModel).toBe("Initial content");
  });

  it("should handle initial content in the element for objects", () => {
    $compile('<div ng-setter="testModel.a">Initial content</div>')($rootScope);
    $rootScope.$digest();

    expect($rootScope.testModel.a).toBe("Initial content");
  });

  it("should convert initial content in the element to numbers if possible", () => {
    $compile('<div ng-setter="testModel.a">1</div>')($rootScope);
    $rootScope.$digest();

    expect($rootScope.testModel.a).toBe(1);
  });

  it("should warn if no model expression is provided", () => {
    spyOn(console, "warn");

    $compile("<div ng-setter></div>")($rootScope);
    $rootScope.$digest();

    expect(console.warn).toHaveBeenCalledWith(
      "ngSetter: Model expression is not provided.",
    );
  });

  it("should clean up the MutationObserver on scope destruction", async () => {
    spyOn(window, "MutationObserver").and.returnValue(observerSpy);
    $compile('<div ng-setter="testModel"></div>')($rootScope);
    $rootScope.$destroy();
    await wait();
    expect(observerSpy.disconnect).toHaveBeenCalled();
  });

  it("should gracefully handle invalid DOM elements", () => {
    spyOn(console, "warn");

    const element = $compile("<div></div>")($rootScope);
    $rootScope.$digest();

    expect(console.warn).not.toHaveBeenCalledWith(
      "ngSetter: Element is not a valid DOM node.",
    );
  });
});
