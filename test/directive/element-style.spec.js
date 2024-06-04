import { publishExternalAPI } from "../../src/public";
import { createInjector } from "../../src/injector";
import { dealoc, jqLite } from "../../src/jqLite";

describe("style", () => {
  let $rootScope;
  let $compile;
  let element;

  beforeEach(() => {
    publishExternalAPI();
    createInjector(["ng"]).invoke((_$rootScope_, _$compile_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should compile style element without binding", () => {
    element = jqLite(
      '<style type="text/css">.header{font-size:1.5em; h3{font-size:1.5em}}</style>',
    );
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe(
      ".header{font-size:1.5em; h3{font-size:1.5em}}",
    );
  });

  it("should compile style element with one simple bind", () => {
    element = jqLite(
      '<style type="text/css">.some-container{ width: {{elementWidth}}px; }</style>',
    );
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe(".some-container{ width: px; }");

    $rootScope.$apply(() => {
      $rootScope.elementWidth = 200;
    });

    expect(element[0].innerHTML).toBe(".some-container{ width: 200px; }");
  });

  it("should compile style element with one bind", () => {
    element = jqLite(
      '<style type="text/css">.header{ h3 { font-size: {{fontSize}}em }}</style>',
    );
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe(".header{ h3 { font-size: em }}");

    $rootScope.$apply(() => {
      $rootScope.fontSize = 1.5;
    });

    expect(element[0].innerHTML).toBe(".header{ h3 { font-size: 1.5em }}");
  });

  it("should compile style element with two binds", () => {
    element = jqLite(
      '<style type="text/css">.header{ h3 { font-size: {{fontSize}}{{unit}} }}</style>',
    );
    $compile(element)($rootScope);
    $rootScope.$digest();

    expect(element[0].innerHTML).toBe(".header{ h3 { font-size:  }}");

    $rootScope.$apply(() => {
      $rootScope.fontSize = 1.5;
      $rootScope.unit = "em";
    });

    expect(element[0].innerHTML).toBe(".header{ h3 { font-size: 1.5em }}");
  });

  it("should compile content of element with style attr", () => {
    element = jqLite('<div style="some">{{bind}}</div>');
    $compile(element)($rootScope);
    $rootScope.$apply(() => {
      $rootScope.bind = "value";
    });

    expect(element.text()).toBe("value");
  });
});
