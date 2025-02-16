import { createInjector } from "../../core/di/injector.js";
import { forEach } from "../../shared/utils.js";
import { Angular } from "../../loader.js";

describe("ngBindHtml", () => {
  let $rootScope, $compile;

  beforeEach(() => {
    window.angular = new Angular();
    createInjector(["ng"]).invoke((_$rootScope_, _$compile_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  it("should set html", () => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);
    $rootScope.html = "<div>hello</div>";
    expect(element.innerHTML).toEqual("<div>hello</div>");
  });

  it("should reset html when value is null or undefined", () => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);

    [null, undefined, ""].forEach((val) => {
      $rootScope.html = "some val";
      expect(element.innerHTML).toEqual("some val");

      $rootScope.html = val;
      expect(element.innerHTML).toEqual("");
    });
  });
});
