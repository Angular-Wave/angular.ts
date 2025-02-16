import { Angular } from "../../loader.js";
import { createInjector } from "../../core/di/injector.js";
import { dealoc, JQLite } from "../../shared/dom.js";

describe("style", () => {
  let $rootScope;
  let $compile;
  let element;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular.module("myModule", ["ng"]);
    createInjector(["myModule"]).invoke((_$rootScope_, _$compile_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should compile style element without binding", () => {
    element = (
      '<style type="text/css">.header{font-size:1.5em; h3{font-size:1.5em}}</style>',
    );
    $compile(element)($rootScope);
    expect(element.innerHTML).toBe(
      ".header{font-size:1.5em; h3{font-size:1.5em}}",
    );
  });

  it("should compile style element with one simple bind", () => {
    element = (
      '<style type="text/css">.some-container{ width: {{elementWidth}}px; }</style>',
    );
    $compile(element)($rootScope);
    expect(element.innerHTML).toBe(".some-container{ width: px; }");

    $rootScope.$apply(() => {
      $rootScope.elementWidth = 200;
    });

    expect(element.innerHTML).toBe(".some-container{ width: 200px; }");
  });

  it("should compile style element with one bind", () => {
    element = (
      '<style type="text/css">.header{ h3 { font-size: {{fontSize}}em }}</style>',
    );
    $compile(element)($rootScope);
    expect(element.innerHTML).toBe(".header{ h3 { font-size: em }}");

    $rootScope.$apply(() => {
      $rootScope.fontSize = 1.5;
    });

    expect(element.innerHTML).toBe(".header{ h3 { font-size: 1.5em }}");
  });

  it("should compile style element with two binds", () => {
    element = (
      '<style type="text/css">.header{ h3 { font-size: {{fontSize}}{{unit}} }}</style>',
    );
    $compile(element)($rootScope);
    expect(element.innerHTML).toBe(".header{ h3 { font-size:  }}");

    $rootScope.$apply(() => {
      $rootScope.fontSize = 1.5;
      $rootScope.unit = "em";
    });

    expect(element.innerHTML).toBe(".header{ h3 { font-size: 1.5em }}");
  });

  it("should compile content of element with style attr", () => {
    element = ('<div style="some">{{bind}}</div>');
    $compile(element)($rootScope);
    $rootScope.$apply(() => {
      $rootScope.bind = "value";
    });

    expect(element.textContent).toBe("value");
  });
});
