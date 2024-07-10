import { dealoc, jqLite } from "../../jqlite";
import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";

describe("ngNonBindable", () => {
  let element;
  let $rootScope;
  let injector;
  let $compile;

  beforeEach(() => {
    publishExternalAPI().decorator("$exceptionHandler", function () {
      return (exception, cause) => {
        throw new Error(exception.message);
      };
    });
    injector = createInjector(["ng"]);
    $compile = injector.get("$compile");
    $rootScope = injector.get("$rootScope");
  });

  afterEach(() => {
    dealoc(element);
    jqLite.CACHE.clear();
  });

  it("should prevent compilation of the owning element and its children", () => {
    element = $compile(
      '<div ng-non-bindable text="{{name}}"><span ng-bind="name"></span></div>',
    )($rootScope);
    element = $compile(
      "<div>" +
        '  <span id="s1">{{a}}</span>' +
        '  <span id="s2" ng-bind="b"></span>' +
        '  <div foo="{{a}}" ng-non-bindable>' +
        '    <span ng-bind="a"></span>{{b}}' +
        "  </div>" +
        '  <span id="s3">{{a}}</span>' +
        '  <span id="s4" ng-bind="b"></span>' +
        "</div>",
    )($rootScope);
    $rootScope.a = "one";
    $rootScope.b = "two";
    $rootScope.$digest();
    // Bindings not contained by ng-non-bindable should resolve.
    const spans = element.find("span");
    expect(spans.eq(0).text()).toEqual("one");
    expect(spans.eq(1).text()).toEqual("two");
    expect(spans.eq(3).text()).toEqual("one");
    expect(spans.eq(4).text()).toEqual("two");
    // Bindings contained by ng-non-bindable should be left alone.
    const nonBindableDiv = element.find("div");
    expect(nonBindableDiv.attr("foo")).toEqual("{{a}}");
    expect(nonBindableDiv.text().trim()).toEqual("{{b}}");
  });
});
