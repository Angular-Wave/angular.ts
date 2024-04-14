import { createInjector } from "../../src/injector";
import { forEach } from "../../src/ng/utils";
import { publishExternalAPI } from "../../src/public";

describe("ngBindHtml", () => {
  let injector;
  let $rootScope;
  let $compile;

  beforeEach(() => {
    publishExternalAPI();
    injector = createInjector(["ng", "ngSanitize"]);
    injector.invoke((_$rootScope_, _$compile_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  it("should set html", () => {
    const element = $compile('<div ng-bind-html="html"></div>')($rootScope);
    $rootScope.html = "<div unknown>hello</div>";
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
