import { createInjector } from "../../injector";
import { forEach } from "../../shared/utils";
import { Angular } from "../../loader";

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
    $rootScope.$digest();
    expect(element.html()).toEqual("<div>hello</div>");
  });

  it("should reset html when value is null or undefined", () => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);

    forEach([null, undefined, ""], (val) => {
      $rootScope.html = "some val";
      $rootScope.$digest();
      expect(element.html()).toEqual("some val");

      $rootScope.html = val;
      $rootScope.$digest();
      expect(element.html()).toEqual("");
    });
  });
});
