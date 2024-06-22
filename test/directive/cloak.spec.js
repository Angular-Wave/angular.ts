import { dealoc, jqLite } from "../../src/jqLite";
import { publishExternalAPI } from "../../src/public";
import { createInjector } from "../../src/injector";

describe("ngCloak", () => {
  let element;
  let $compile;
  let $rootScope;
  let injector;

  beforeEach(() => {
    publishExternalAPI();
    injector = createInjector(["ng"]);
    $compile = injector.get("$compile");
    $rootScope = injector.get("$rootScope");
  });

  afterEach(() => {
    dealoc(element);
    jqLite.CACHE.clear();
  });

  it("should get removed when an element is compiled", () => {
    element = jqLite("<div ng-cloak></div>");
    expect(element.attr("ng-cloak")).toBe("");
    $compile(element);
    expect(element.attr("ng-cloak")).toBeUndefined();
  });

  it("should remove ngCloak class from a compiled element with attribute", () => {
    element = jqLite('<div ng-cloak class="foo ng-cloak bar"></div>');

    expect(element[0].classList.contains("foo")).toBe(true);
    expect(element[0].classList.contains("ng-cloak")).toBe(true);
    expect(element[0].classList.contains("bar")).toBe(true);

    $compile(element);

    expect(element[0].classList.contains("foo")).toBe(true);
    expect(element[0].classList.contains("ng-cloak")).toBe(false);
    expect(element[0].classList.contains("bar")).toBe(true);
  });
});
