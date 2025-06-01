import { Angular } from "../loader.js";
import { createInjector } from "./di/injector.js";

describe("ngOn* event binding", () => {
  let $rootScope, module, injector, $compile;

  beforeEach(() => {
    window.angular = new Angular();
    module = window.angular.module("test1", ["ng"]);
    injector = createInjector(["ng", "test1"]);
    $rootScope = injector.get("$rootScope");
    $compile = injector.get("$compile");
  });

  it("should add event listener of specified name", () => {
    $rootScope.name = "Misko";
    const element = $compile('<span ng-on-foo="name = name + 3"></span>')(
      $rootScope,
    );
    triggerHandler(element, "foo");
    expect($rootScope.name).toBe("Misko3");
  });

  it("should allow access to the $event object", () => {
    const element = $compile('<span ng-on-foo="e = $event"></span>')(
      $rootScope,
    );
    triggerHandler(element, "foo");
    expect($rootScope.e.target).toBe(element);
  });

  it("should call the listener synchronously", () => {
    const element = $compile('<span ng-on-foo="fooEvent()"></span>')(
      $rootScope,
    );
    $rootScope.fooEvent = jasmine.createSpy("fooEvent");

    triggerHandler(element, "foo");

    expect($rootScope.fooEvent).toHaveBeenCalled();
  });

  it("should support multiple events on a single element", () => {
    const element = $compile(
      '<span ng-on-foo="fooEvent()" ng-on-bar="barEvent()"></span>',
    )($rootScope);
    $rootScope.fooEvent = jasmine.createSpy("fooEvent");
    $rootScope.barEvent = jasmine.createSpy("barEvent");

    triggerHandler(element, "foo");
    expect($rootScope.fooEvent).toHaveBeenCalled();
    expect($rootScope.barEvent).not.toHaveBeenCalled();

    $rootScope.fooEvent.calls.reset();
    $rootScope.barEvent.calls.reset();

    triggerHandler(element, "bar");
    expect($rootScope.fooEvent).not.toHaveBeenCalled();
    expect($rootScope.barEvent).toHaveBeenCalled();
  });

  it("should work with different prefixes", () => {
    const cb = ($rootScope.cb = jasmine.createSpy("ng-on cb"));
    const element = $compile(
      '<span ng-on-test="cb(1)" ng-On-test2="cb(2)"></span>',
    )($rootScope);

    triggerHandler(element, "test");
    expect(cb).toHaveBeenCalledWith(1);

    triggerHandler(element, "test2");
    expect(cb).toHaveBeenCalledWith(2);
  });

  it("should work if they are prefixed with data- and different prefixes", () => {
    const cb = ($rootScope.cb = jasmine.createSpy("ng-on cb"));
    const element = $compile(
      '<span data-ng-on-test2="cb(2)" ng-on-test3="cb(3)" data-ng-on-test4="cb(4)" ' +
        'ng-on-test5="cb(5)" ng-on-test6="cb(6)"></span>',
    )($rootScope);

    triggerHandler(element, "test2");
    expect(cb).toHaveBeenCalledWith(2);

    triggerHandler(element, "test3");
    expect(cb).toHaveBeenCalledWith(3);

    triggerHandler(element, "test4");
    expect(cb).toHaveBeenCalledWith(4);

    triggerHandler(element, "test5");
    expect(cb).toHaveBeenCalledWith(5);

    triggerHandler(element, "test6");
    expect(cb).toHaveBeenCalledWith(6);
  });

  it("should work independently of attributes with the same name", () => {
    const element = $compile('<span ng-on-asdf="cb()" asdf="foo" />')(
      $rootScope,
    );
    const cb = ($rootScope.cb = jasmine.createSpy("ng-on cb"));
    triggerHandler(element, "asdf");
    expect(cb).toHaveBeenCalled();
    expect(element.getAttribute("asdf")).toBe("foo");
  });

  it("should work independently of (ng-)attributes with the same name", () => {
    const element = $compile('<span ng-on-asdf="cb()" ng-attr-asdf="foo" />')(
      $rootScope,
    );
    const cb = ($rootScope.cb = jasmine.createSpy("ng-on cb"));
    triggerHandler(element, "asdf");
    expect(cb).toHaveBeenCalled();
    expect(element.getAttribute("asdf")).toBe("foo");
  });

  it("should work independently of properties with the same name", () => {
    const element = $compile('<span ng-on-asdf="cb()" ng-prop-asdf="123" />')(
      $rootScope,
    );
    const cb = ($rootScope.cb = jasmine.createSpy("ng-on cb"));
    triggerHandler(element, "asdf");
    expect(cb).toHaveBeenCalled();
    expect(element.asdf).toBe(123);
  });

  it("should use the full ng-on-* attribute name in $attr mappings", () => {
    let attrs;
    window.angular.module("test", [
      "ng",
      ($compileProvider) => {
        $compileProvider.directive("attrExposer", () => ({
          link($scope, $element, $attrs) {
            attrs = $attrs;
          },
        }));
      },
    ]);
    injector = createInjector(["ng", "test"]);
    $rootScope = injector.get("$rootScope");
    $compile = injector.get("$compile");
    $compile(
      '<div attr-exposer ng-on-title="cb(1)" ng-on-super-title="cb(2)" ng-on-my-camel-title="cb(3)">',
    )($rootScope);

    expect(attrs.title).toBeUndefined();
    expect(attrs.$attr.title).toBeUndefined();
    expect(attrs.ngOnTitle).toBe("cb(1)");
    expect(attrs.$attr.ngOnTitle).toBe("ng-on-title");

    expect(attrs.superTitle).toBeUndefined();
    expect(attrs.$attr.superTitle).toBeUndefined();
    expect(attrs.ngOnSuperTitle).toBe("cb(2)");
    expect(attrs.$attr.ngOnSuperTitle).toBe("ng-on-super-title");

    expect(attrs.myCamelTitle).toBeUndefined();
    expect(attrs.$attr.myCamelTitle).toBeUndefined();
    expect(attrs.ngOnMyCamelTitle).toBe("cb(3)");
    expect(attrs.$attr.ngOnMyCamelTitle).toBe("ng-on-my-camel-title");
  });

  it("should not conflict with (ng-attr-)attribute mappings of the same name", () => {
    let attrs;
    window.angular.module("test", [
      "ng",
      ($compileProvider) => {
        $compileProvider.directive("attrExposer", () => ({
          link($scope, $element, $attrs) {
            attrs = $attrs;
          },
        }));
      },
    ]);
    injector = createInjector(["ng", "test"]);
    $rootScope = injector.get("$rootScope");
    $compile = injector.get("$compile");

    $compile(
      '<div attr-exposer ng-on-title="42" ng-attr-title="foo" title="bar">',
    )($rootScope);
    expect(attrs.title).toBe("foo");
    expect(attrs.$attr.title).toBe("title");
    expect(attrs.$attr.ngOnTitle).toBe("ng-on-title");
  });

  it("should correctly bind to kebab-cased event names", () => {
    const element = $compile('<span ng-on-foo-bar="cb()"></span>')($rootScope);
    const cb = ($rootScope.cb = jasmine.createSpy("ng-on cb"));
    triggerHandler(element, "foobar");
    triggerHandler(element, "fooBar");
    expect(cb).not.toHaveBeenCalled();

    triggerHandler(element, "foo-bar");
    expect(cb).toHaveBeenCalled();
  });

  it("should correctly bind to camelCased event names", () => {
    const element = $compile('<span ng-on-foo_bar="cb()"></span>')($rootScope);
    const cb = ($rootScope.cb = jasmine.createSpy("ng-on cb"));
    triggerHandler(element, "foobar");
    triggerHandler(element, "foo-bar");
    triggerHandler(element, "foo-bar");
    triggerHandler(element, "foo-bar");
    expect(cb).not.toHaveBeenCalled();

    triggerHandler(element, "fooBar");
    expect(cb).toHaveBeenCalled();
  });
});
