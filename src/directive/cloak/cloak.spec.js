import { createElementFromHTML, dealoc } from "../../shared/dom.js";
import { Angular } from "../../loader.js";
import { createInjector } from "../../core/di/injector.js";

describe("ngCloak", () => {
  let element;
  let $compile;
  let $rootScope;
  let injector;

  beforeEach(() => {
    window.angular = new Angular();
    injector = createInjector(["ng"]);
    $compile = injector.get("$compile");
    $rootScope = injector.get("$rootScope");
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should get removed when an element is compiled", () => {
    element = createElementFromHTML("<div ng-cloak></div>");
    expect(element.getAttribute("ng-cloak")).toBe("");
    $compile(element);
    expect(element.getAttribute("ng-cloak")).toBeNull();
  });

  it("should remove ngCloak class from a compiled element with attribute", () => {
    element = createElementFromHTML(
      '<div ng-cloak class="foo ng-cloak bar"></div>',
    );

    expect(element.classList.contains("foo")).toBe(true);
    expect(element.classList.contains("ng-cloak")).toBe(true);
    expect(element.classList.contains("bar")).toBe(true);

    $compile(element);

    expect(element.classList.contains("foo")).toBe(true);
    expect(element.classList.contains("ng-cloak")).toBe(false);
    expect(element.classList.contains("bar")).toBe(true);
  });
});
