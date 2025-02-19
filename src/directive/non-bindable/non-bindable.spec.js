import { dealoc } from "../../shared/dom.js";
import { Angular } from "../../loader.js";
import { createInjector } from "../../core/di/injector.js";
import { wait } from "../../shared/test-utils";

describe("ngNonBindable", () => {
  let element;
  let $rootScope;
  let injector;
  let $compile;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular
      .module("myModule", ["ng"])
      .decorator("$exceptionHandler", function () {
        return (exception, cause) => {
          throw new Error(exception.message);
        };
      });
    injector = createInjector(["myModule"]);
    $compile = injector.get("$compile");
    $rootScope = injector.get("$rootScope");
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should prevent compilation of the owning element and its children", async () => {
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
    await wait();
    // Bindings not contained by ng-non-bindable should resolve.
    const spans = element.find("span");
    expect(spans.eq(0).textContent).toEqual("one");
    expect(spans.eq(1).textContent).toEqual("two");
    expect(spans.eq(3).textContent).toEqual("one");
    expect(spans.eq(4).textContent).toEqual("two");
    // Bindings contained by ng-non-bindable should be left alone.
    const nonBindableDiv = element.find("div");
    expect(nonBindableDiv.attr("foo")).toEqual("{{a}}");
    expect(nonBindableDiv.textContent.trim()).toEqual("{{b}}");
  });
});
