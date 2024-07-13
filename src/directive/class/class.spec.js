import { dealoc, JQLite } from "../../shared/jqlite/jqlite";
import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";
import { valueFn } from "../../shared/utils";

describe("ngClass", () => {
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
  });

  it("should add new and remove old classes dynamically", () => {
    element = $compile('<div class="existing" ng-class="dynClass"></div>')(
      $rootScope,
    );
    $rootScope.dynClass = "A";
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBe(true);
    expect(element[0].classList.contains("A")).toBe(true);

    $rootScope.dynClass = "B";
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBe(true);
    expect(element[0].classList.contains("A")).toBe(false);
    expect(element[0].classList.contains("B")).toBe(true);

    delete $rootScope.dynClass;
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBe(true);
    expect(element[0].classList.contains("A")).toBe(false);
    expect(element[0].classList.contains("B")).toBe(false);
  });

  it("should add new and remove old classes with same names as Object.prototype properties dynamically", () => {
    element = $compile('<div class="existing" ng-class="dynClass"></div>')(
      $rootScope,
    );
    $rootScope.dynClass = {
      watch: true,
      hasOwnProperty: true,
      isPrototypeOf: true,
    };
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBe(true);
    expect(element[0].classList.contains("watch")).toBe(true);
    expect(element[0].classList.contains("hasOwnProperty")).toBe(true);
    expect(element[0].classList.contains("isPrototypeOf")).toBe(true);

    $rootScope.dynClass.watch = false;
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBe(true);
    expect(element[0].classList.contains("watch")).toBe(false);
    expect(element[0].classList.contains("hasOwnProperty")).toBe(true);
    expect(element[0].classList.contains("isPrototypeOf")).toBe(true);

    delete $rootScope.dynClass;
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBe(true);
    expect(element[0].classList.contains("watch")).toBe(false);
    expect(element[0].classList.contains("hasOwnProperty")).toBe(false);
    expect(element[0].classList.contains("isPrototypeOf")).toBe(false);
  });

  it("should support adding multiple classes via an array", () => {
    element = $compile(
      "<div class=\"existing\" ng-class=\"['A', 'B']\"></div>",
    )($rootScope);
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBeTruthy();
    expect(element[0].classList.contains("A")).toBeTruthy();
    expect(element[0].classList.contains("B")).toBeTruthy();
  });

  it(
    "should support adding multiple classes conditionally via a map of class names to boolean " +
      "expressions",
    () => {
      element = $compile(
        '<div class="existing" ' +
          'ng-class="{A: conditionA, B: conditionB(), AnotB: conditionA&&!conditionB()}">' +
          "</div>",
      )($rootScope);
      $rootScope.conditionA = true;
      $rootScope.$digest();
      expect(element[0].classList.contains("existing")).toBeTruthy();
      expect(element[0].classList.contains("A")).toBeTruthy();
      expect(element[0].classList.contains("B")).toBeFalsy();
      expect(element[0].classList.contains("AnotB")).toBeTruthy();

      $rootScope.conditionB = function () {
        return true;
      };
      $rootScope.$digest();
      expect(element[0].classList.contains("existing")).toBeTruthy();
      expect(element[0].classList.contains("A")).toBeTruthy();
      expect(element[0].classList.contains("B")).toBeTruthy();
      expect(element[0].classList.contains("AnotB")).toBeFalsy();
    },
  );

  it("should not break when passed non-string/array/object, truthy values", () => {
    element = $compile('<div ng-class="42"></div>')($rootScope);
    $rootScope.$digest();
    expect(element[0].classList.contains("42")).toBeTruthy();
  });

  it("should support adding multiple classes via an array mixed with conditionally via a map", () => {
    element = $compile(
      "<div class=\"existing\" ng-class=\"['A', {'B': condition}]\"></div>",
    )($rootScope);
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBeTruthy();
    expect(element[0].classList.contains("A")).toBeTruthy();
    expect(element[0].classList.contains("B")).toBeFalsy();
    $rootScope.condition = true;
    $rootScope.$digest();
    expect(element[0].classList.contains("B")).toBeTruthy();
  });

  it("should remove classes when the referenced object is the same but its property is changed", () => {
    element = $compile('<div ng-class="classes"></div>')($rootScope);
    $rootScope.classes = { A: true, B: true };
    $rootScope.$digest();
    expect(element[0].classList.contains("A")).toBeTruthy();
    expect(element[0].classList.contains("B")).toBeTruthy();
    $rootScope.classes.A = false;
    $rootScope.$digest();
    expect(element[0].classList.contains("A")).toBeFalsy();
    expect(element[0].classList.contains("B")).toBeTruthy();
  });

  it("should support adding multiple classes via a space delimited string", () => {
    element = $compile('<div class="existing" ng-class="\'A B\'"></div>')(
      $rootScope,
    );
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBeTruthy();
    expect(element[0].classList.contains("A")).toBeTruthy();
    expect(element[0].classList.contains("B")).toBeTruthy();
  });

  it("should support adding multiple classes via a space delimited string inside an array", () => {
    element = $compile(
      "<div class=\"existing\" ng-class=\"['A B', 'C']\"></div>",
    )($rootScope);
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBeTruthy();
    expect(element[0].classList.contains("A")).toBeTruthy();
    expect(element[0].classList.contains("B")).toBeTruthy();
    expect(element[0].classList.contains("C")).toBeTruthy();
  });

  it("should preserve class added post compilation with pre-existing classes", () => {
    element = $compile('<div class="existing" ng-class="dynClass"></div>')(
      $rootScope,
    );
    $rootScope.dynClass = "A";
    $rootScope.$digest();
    expect(element[0].classList.contains("existing")).toBe(true);

    // add extra class, change model and eval
    element[0].classList.add("newClass");
    $rootScope.dynClass = "B";
    $rootScope.$digest();

    expect(element[0].classList.contains("existing")).toBe(true);
    expect(element[0].classList.contains("B")).toBe(true);
    expect(element[0].classList.contains("newClass")).toBe(true);
  });

  it('should preserve class added post compilation without pre-existing classes"', () => {
    element = $compile('<div ng-class="dynClass"></div>')($rootScope);
    $rootScope.dynClass = "A";
    $rootScope.$digest();
    expect(element[0].classList.contains("A")).toBe(true);

    // add extra class, change model and eval
    element[0].classList.add("newClass");
    $rootScope.dynClass = "B";
    $rootScope.$digest();

    expect(element[0].classList.contains("B")).toBe(true);
    expect(element[0].classList.contains("newClass")).toBe(true);
  });

  it('should preserve other classes with similar name"', () => {
    element = $compile(
      '<div class="ui-panel ui-selected" ng-class="dynCls"></div>',
    )($rootScope);
    $rootScope.dynCls = "panel";
    $rootScope.$digest();
    $rootScope.dynCls = "foo";
    $rootScope.$digest();
    expect(element[0].className).toBe("ui-panel ui-selected foo");
  });

  it("should not add duplicate classes", () => {
    element = $compile('<div class="panel bar" ng-class="dynCls"></div>')(
      $rootScope,
    );
    $rootScope.dynCls = "panel";
    $rootScope.$digest();
    expect(element[0].className).toBe("panel bar");
  });

  it("should remove classes even if it was specified via class attribute", () => {
    element = $compile('<div class="panel bar" ng-class="dynCls"></div>')(
      $rootScope,
    );
    $rootScope.dynCls = "panel";
    $rootScope.$digest();
    $rootScope.dynCls = "window";
    $rootScope.$digest();
    expect(element[0].className).toBe("bar window");
  });

  it("should remove classes even if they were added by another code", () => {
    element = $compile('<div ng-class="dynCls"></div>')($rootScope);
    $rootScope.dynCls = "foo";
    $rootScope.$digest();
    element[0].classList.add("foo");
    $rootScope.dynCls = "";
    $rootScope.$digest();
  });

  it("should convert undefined and null values to an empty string", () => {
    element = $compile('<div ng-class="dynCls"></div>')($rootScope);
    $rootScope.dynCls = [undefined, null];
    $rootScope.$digest();
  });

  it("should ngClass odd/even", () => {
    element = $compile(
      '<ul><li ng-repeat="i in [0,1]" class="existing" ng-class-odd="\'odd\'" ng-class-even="\'even\'"></li><ul>',
    )($rootScope);
    $rootScope.$digest();
    const e1 = JQLite(element[0].childNodes[1]);
    const e2 = JQLite(element[0].childNodes[3]);
    expect(e1[0].classList.contains("existing")).toBeTruthy();
    expect(e1[0].classList.contains("odd")).toBeTruthy();
    expect(e2[0].classList.contains("existing")).toBeTruthy();
    expect(e2[0].classList.contains("even")).toBeTruthy();
  });

  it("should allow both ngClass and ngClassOdd/Even on the same element", () => {
    element = $compile(
      "<ul>" +
        '<li ng-repeat="i in [0,1]" ng-class="\'plainClass\'" ' +
        "ng-class-odd=\"'odd'\" ng-class-even=\"'even'\"></li>" +
        "<ul>",
    )($rootScope);
    $rootScope.$apply();
    const e1 = JQLite(element[0].childNodes[1]);
    const e2 = JQLite(element[0].childNodes[3]);

    expect(e1[0].classList.contains("plainClass")).toBeTruthy();
    expect(e1[0].classList.contains("odd")).toBeTruthy();
    expect(e1[0].classList.contains("even")).toBeFalsy();
    expect(e2[0].classList.contains("plainClass")).toBeTruthy();
    expect(e2[0].classList.contains("even")).toBeTruthy();
    expect(e2[0].classList.contains("odd")).toBeFalsy();
  });

  it("should allow ngClassOdd/Even on the same element with overlapping classes", () => {
    element = $compile(
      "<ul>" +
        '<li ng-repeat="i in [0,1,2]" ' +
        "ng-class-odd=\"'same odd'\" " +
        "ng-class-even=\"'same even'\">" +
        "</li>" +
        "<ul>",
    )($rootScope);
    $rootScope.$digest();

    const e1 = element.children().eq(0)[0];
    const e2 = element.children().eq(1)[0];
    const e3 = element.children().eq(2)[0];

    expect(e1).toHaveClass("same");
    expect(e1).toHaveClass("odd");
    expect(e1).not.toHaveClass("even");
    expect(e2).toHaveClass("same");
    expect(e2).not.toHaveClass("odd");
    expect(e2).toHaveClass("even");
    expect(e3).toHaveClass("same");
    expect(e3).toHaveClass("odd");
    expect(e3).not.toHaveClass("even");
  });

  it("should allow ngClass with overlapping classes", () => {
    element = $compile(
      "<div ng-class=\"{'same yes': test, 'same no': !test}\"></div>",
    )($rootScope)[0];
    $rootScope.$digest();

    expect(element).toHaveClass("same");
    expect(element).not.toHaveClass("yes");
    expect(element).toHaveClass("no");

    $rootScope.$apply("test = true");

    expect(element).toHaveClass("same");
    expect(element).toHaveClass("yes");
    expect(element).not.toHaveClass("no");
  });

  it("should allow both ngClass and ngClassOdd/Even with multiple classes", () => {
    element = $compile(
      "<ul>" +
        "<li ng-repeat=\"i in [0,1]\" ng-class=\"['A', 'B']\" " +
        "ng-class-odd=\"['C', 'D']\" ng-class-even=\"['E', 'F']\"></li>" +
        "<ul>",
    )($rootScope);
    $rootScope.$apply();
    const e1 = JQLite(element[0].childNodes[1]);
    const e2 = JQLite(element[0].childNodes[3]);

    expect(e1[0].classList.contains("A")).toBeTruthy();
    expect(e1[0].classList.contains("B")).toBeTruthy();
    expect(e1[0].classList.contains("C")).toBeTruthy();
    expect(e1[0].classList.contains("D")).toBeTruthy();
    expect(e1[0].classList.contains("E")).toBeFalsy();
    expect(e1[0].classList.contains("F")).toBeFalsy();

    expect(e2[0].classList.contains("A")).toBeTruthy();
    expect(e2[0].classList.contains("B")).toBeTruthy();
    expect(e2[0].classList.contains("E")).toBeTruthy();
    expect(e2[0].classList.contains("F")).toBeTruthy();
    expect(e2[0].classList.contains("C")).toBeFalsy();
    expect(e2[0].classList.contains("D")).toBeFalsy();
  });

  it("should reapply ngClass when interpolated class attribute changes", () => {
    element = $compile(
      "<div>" +
        '<div class="one {{two}} three" ng-class="{five: five}"></div>' +
        '<div class="one {{two}} three {{four}}" ng-class="{five: five}"></div>' +
        "</div>",
    )($rootScope);
    const e1 = element.children().eq(0)[0];
    const e2 = element.children().eq(1)[0];

    $rootScope.$apply('two = "two"; five = true');

    expect(e1).toHaveClass("one");
    expect(e1).toHaveClass("two");
    expect(e1).toHaveClass("three");
    expect(e1).not.toHaveClass("four");
    expect(e1).toHaveClass("five");
    expect(e2).toHaveClass("one");
    expect(e2).toHaveClass("two");
    expect(e2).toHaveClass("three");
    expect(e2).not.toHaveClass("four");
    expect(e2).toHaveClass("five");

    $rootScope.$apply('two = "another-two"');

    expect(e1).toHaveClass("one");
    expect(e1).not.toHaveClass("two");
    expect(e1).toHaveClass("another-two");
    expect(e1).toHaveClass("three");
    expect(e1).not.toHaveClass("four");
    expect(e1).toHaveClass("five");
    expect(e2).toHaveClass("one");
    expect(e2).not.toHaveClass("two");
    expect(e2).toHaveClass("another-two");
    expect(e2).toHaveClass("three");
    expect(e2).not.toHaveClass("four");
    expect(e2).toHaveClass("five");

    $rootScope.$apply('two = "two-more"; four = "four"');

    expect(e1).toHaveClass("one");
    expect(e1).not.toHaveClass("two");
    expect(e1).not.toHaveClass("another-two");
    expect(e1).toHaveClass("two-more");
    expect(e1).toHaveClass("three");
    expect(e1).not.toHaveClass("four");
    expect(e1).toHaveClass("five");
    expect(e2).toHaveClass("one");
    expect(e2).not.toHaveClass("two");
    expect(e2).not.toHaveClass("another-two");
    expect(e2).toHaveClass("two-more");
    expect(e2).toHaveClass("three");
    expect(e2).toHaveClass("four");
    expect(e2).toHaveClass("five");

    $rootScope.$apply("five = false");

    expect(e1).toHaveClass("one");
    expect(e1).not.toHaveClass("two");
    expect(e1).not.toHaveClass("another-two");
    expect(e1).toHaveClass("two-more");
    expect(e1).toHaveClass("three");
    expect(e1).not.toHaveClass("four");
    expect(e1).not.toHaveClass("five");
    expect(e2).toHaveClass("one");
    expect(e2).not.toHaveClass("two");
    expect(e2).not.toHaveClass("another-two");
    expect(e2).toHaveClass("two-more");
    expect(e2).toHaveClass("three");
    expect(e2).toHaveClass("four");
    expect(e2).not.toHaveClass("five");
  });

  it("should not mess up class value due to observing an interpolated class attribute", () => {
    $rootScope.foo = true;
    $rootScope.$watch("anything", () => {
      $rootScope.foo = false;
    });
    element = $compile('<div ng-class="{foo:foo}"></div>')($rootScope);
    $rootScope.$digest();
    expect(element[0].classList.contains("foo")).toBe(false);
  });

  it("should update ngClassOdd/Even when an item is added to the model", () => {
    element = $compile(
      "<ul>" +
        '<li ng-repeat="i in items" ' +
        "ng-class-odd=\"'odd'\" ng-class-even=\"'even'\">i</li>" +
        "<ul>",
    )($rootScope);
    $rootScope.items = ["b", "c", "d"];
    $rootScope.$digest();

    $rootScope.items.unshift("a");
    $rootScope.$digest();

    const e1 = JQLite(element[0].childNodes[1]);
    const e4 = JQLite(element[0].childNodes[3]);

    expect(e1[0].classList.contains("odd")).toBeTruthy();
    expect(e1[0].classList.contains("even")).toBeFalsy();

    expect(e4[0].classList.contains("even")).toBeTruthy();
    expect(e4[0].classList.contains("odd")).toBeFalsy();
  });

  it("should update ngClassOdd/Even when model is changed by filtering", () => {
    element = $compile(
      "<ul>" +
        '<li ng-repeat="i in items track by $index" ' +
        "ng-class-odd=\"'odd'\" ng-class-even=\"'even'\"></li>" +
        "<ul>",
    )($rootScope);
    $rootScope.items = ["a", "b", "a"];
    $rootScope.$digest();

    $rootScope.items = ["a", "a"];
    $rootScope.$digest();

    const e1 = JQLite(element[0].childNodes[1]);
    const e2 = JQLite(element[0].childNodes[3]);

    expect(e1[0].classList.contains("odd")).toBeTruthy();
    expect(e1[0].classList.contains("even")).toBeFalsy();

    expect(e2[0].classList.contains("even")).toBeTruthy();
    expect(e2[0].classList.contains("odd")).toBeFalsy();
  });

  it("should update ngClassOdd/Even when model is changed by sorting", () => {
    element = $compile(
      "<ul>" +
        '<li ng-repeat="i in items" ' +
        "ng-class-odd=\"'odd'\" ng-class-even=\"'even'\">i</li>" +
        "<ul>",
    )($rootScope);
    $rootScope.items = ["a", "b"];
    $rootScope.$digest();

    $rootScope.items = ["b", "a"];
    $rootScope.$digest();

    const e1 = JQLite(element[0].childNodes[1]);
    const e2 = JQLite(element[0].childNodes[3]);

    expect(e1[0].classList.contains("odd")).toBeTruthy();
    expect(e1[0].classList.contains("even")).toBeFalsy();

    expect(e2[0].classList.contains("even")).toBeTruthy();
    expect(e2[0].classList.contains("odd")).toBeFalsy();
  });

  it("should add/remove the correct classes when the expression and `$index` change simultaneously", () => {
    element = $compile(
      "<div>" +
        '<div ng-class-odd="foo"></div>' +
        '<div ng-class-even="foo"></div>' +
        "</div>",
    )($rootScope);
    const odd = element.children().eq(0)[0];
    const even = element.children().eq(1)[0];

    $rootScope.$apply('$index = 0; foo = "class1"');

    expect(odd).toHaveClass("class1");
    expect(odd).not.toHaveClass("class2");
    expect(even).not.toHaveClass("class1");
    expect(even).not.toHaveClass("class2");

    $rootScope.$apply('$index = 1; foo = "class2"');

    expect(odd).not.toHaveClass("class1");
    expect(odd).not.toHaveClass("class2");
    expect(even).not.toHaveClass("class1");
    expect(even).toHaveClass("class2");

    $rootScope.$apply('foo = "class1"');

    expect(odd).not.toHaveClass("class1");
    expect(odd).not.toHaveClass("class2");
    expect(even).toHaveClass("class1");
    expect(even).not.toHaveClass("class2");

    $rootScope.$apply("$index = 2");

    expect(odd).toHaveClass("class1");
    expect(odd).not.toHaveClass("class2");
    expect(even).not.toHaveClass("class1");
    expect(even).not.toHaveClass("class2");
  });

  it("should support mixed array/object variable with a mutating object", () => {
    element = $compile('<div ng-class="classVar"></div>')($rootScope);

    $rootScope.classVar = [{ orange: true }];
    $rootScope.$digest();
    expect(element[0]).toHaveClass("orange");

    $rootScope.classVar[0].orange = false;
    $rootScope.$digest();

    expect(element[0]).not.toHaveClass("orange");
  });

  // // https://github.com/angular/angular.js/issues/15905
  it("should support a mixed literal-array/object variable", () => {
    element = $compile('<div ng-class="[classVar]"></div>')($rootScope);

    $rootScope.classVar = { orange: true };
    $rootScope.$digest();
    expect(element[0]).toHaveClass("orange");

    $rootScope.classVar.orange = false;
    $rootScope.$digest();

    expect(element[0]).not.toHaveClass("orange");
  });

  it("should support a one-time mixed literal-array/object variable", () => {
    element = $compile('<div ng-class="::[classVar1, classVar2]"></div>')(
      $rootScope,
    );

    $rootScope.classVar1 = { orange: true };
    $rootScope.$digest();
    expect(element[0]).toHaveClass("orange");

    $rootScope.classVar1.orange = false;
    $rootScope.$digest();

    expect(element[0]).not.toHaveClass("orange");
  });

  it("should do value stabilization as expected when one-time binding", () => {
    element = $compile('<div ng-class="::className"></div>')($rootScope);

    $rootScope.$apply('className = "foo"');
    expect(element[0]).toHaveClass("foo");

    $rootScope.$apply('className = "bar"');
    expect(element[0]).toHaveClass("foo");
  });

  it("should remove the watcher when static array one-time binding", () => {
    element = $compile('<div ng-class="::[className]"></div>')($rootScope);

    $rootScope.$apply('className = "foo"');
    expect(element[0]).toHaveClass("foo");

    $rootScope.$apply('className = "bar"');
    expect(element[0]).toHaveClass("foo");
    expect(element[0]).not.toHaveClass("bar");
  });

  it("should remove the watcher when static map one-time binding", () => {
    element = $compile('<div ng-class="::{foo: fooPresent}"></div>')(
      $rootScope,
    );

    $rootScope.$apply("fooPresent = true");
    expect(element[0]).toHaveClass("foo");

    $rootScope.$apply("fooPresent = false");
    expect(element[0]).toHaveClass("foo");
  });

  it("should track changes of mutating object inside an array", () => {
    $rootScope.classVar = [{ orange: true }];
    element = $compile('<div ng-class="classVar"></div>')($rootScope);

    $rootScope.$digest();
    expect(element[0]).toHaveClass("orange");

    $rootScope.$apply("classVar[0].orange = false");
    expect(element[0]).not.toHaveClass("orange");
  });

  // https://github.com/angular/angular.js/issues/15960#issuecomment-299109412
  it("should always reevaluate filters with non-primitive inputs within literals", () => {
    injector = createInjector([
      "ng",
      ($filterProvider) => {
        $filterProvider.register(
          "foo",
          valueFn((o) => o.a || o.b),
        );
      },
    ]);

    injector.invoke(($rootScope, $compile) => {
      $rootScope.testObj = {};
      element = $compile('<div ng-class="{x: (testObj | foo)}">')(
        $rootScope,
      )[0];

      $rootScope.$apply();
      expect(element).not.toHaveClass("x");

      $rootScope.$apply("testObj.a = true");
      expect(element).toHaveClass("x");
    });
  });

  describe("large objects", () => {
    let getProp;
    let veryLargeObj;

    beforeEach(() => {
      getProp = jasmine.createSpy("getProp");
      veryLargeObj = {};

      Object.defineProperty(veryLargeObj, "prop", {
        get: getProp,
        enumerable: true,
      });
    });

    it("should not be copied when using an expression", () => {
      element = $compile('<div ng-class="fooClass"></div>')($rootScope)[0];
      $rootScope.fooClass = { foo: veryLargeObj };
      $rootScope.$digest();

      expect(element).toHaveClass("foo");
      expect(getProp).not.toHaveBeenCalled();
    });

    it("should not be copied when using a literal", () => {
      element = $compile('<div ng-class="{foo: veryLargeObj}"></div>')(
        $rootScope,
      )[0];
      $rootScope.veryLargeObj = veryLargeObj;
      $rootScope.$digest();

      expect(element).toHaveClass("foo");
      expect(getProp).not.toHaveBeenCalled();
    });

    it("should not be copied when inside an array", () => {
      element = $compile('<div ng-class="[{foo: veryLargeObj}]"></div>')(
        $rootScope,
      )[0];
      $rootScope.veryLargeObj = veryLargeObj;
      $rootScope.$digest();

      expect(element).toHaveClass("foo");
      expect(getProp).not.toHaveBeenCalled();
    });

    it("should not be copied when using one-time binding", () => {
      element = $compile(
        '<div ng-class="::{foo: veryLargeObj, bar: bar}"></div>',
      )($rootScope)[0];
      $rootScope.veryLargeObj = veryLargeObj;
      $rootScope.$digest();

      expect(element).toHaveClass("foo");
      expect(element).not.toHaveClass("bar");
      expect(getProp).not.toHaveBeenCalled();

      $rootScope.$apply('veryLargeObj.bar = "bar"');

      expect(element).toHaveClass("foo");
      expect(element).not.toHaveClass("bar");
      expect(getProp).not.toHaveBeenCalled();

      $rootScope.$apply('bar = "bar"');

      expect(element).toHaveClass("foo");
      expect(element).toHaveClass("bar");
      expect(getProp).not.toHaveBeenCalled();

      $rootScope.$apply('veryLargeObj.bar = "qux"');

      expect(element).toHaveClass("foo");
      expect(element).toHaveClass("bar");
      expect(getProp).not.toHaveBeenCalled();
    });
  });
});

// describe("ngClass animations", () => {
//   let body;
//   let element;
//   let $rootElement;

//   afterEach(() => {
//     dealoc(element);
//   });

//   it("should avoid calling addClass accidentally when removeClass is going on", () => {
//     module("ngAnimateMock");
//     inject(($compile, $rootScope, $animate, $timeout) => {
//       element = angular.element('<div ng-class="val"></div>');
//       const body = JQLite(window.document.body);
//       body.append(element);
//       $compile(element)($rootScope);

//       expect($animate.queue.length).toBe(0);

//       $rootScope.val = "one";
//       $rootScope.$digest();
//       expect($animate.queue.shift().event).toBe("addClass");
//       expect($animate.queue.length).toBe(0);

//       $rootScope.val = "";
//       $rootScope.$digest();
//       expect($animate.queue.shift().event).toBe("removeClass"); // only removeClass is called
//       expect($animate.queue.length).toBe(0);

//       $rootScope.val = "one";
//       $rootScope.$digest();
//       expect($animate.queue.shift().event).toBe("addClass");
//       expect($animate.queue.length).toBe(0);

//       $rootScope.val = "two";
//       $rootScope.$digest();
//       expect($animate.queue.shift().event).toBe("addClass");
//       expect($animate.queue.shift().event).toBe("removeClass");
//       expect($animate.queue.length).toBe(0);
//     });
//   });

//   it("should combine the ngClass evaluation with the enter animation", () => {
//     // mocks are not used since the enter delegation method is called before addClass and
//     // it makes it impossible to test to see that addClass is called first
//     module("ngAnimate");
//     module("ngAnimateMock");

//     module(($animateProvider) => {
//       $animateProvider.register(".crazy", () => ({
//         enter(element, done) {
//           element.data("state", "crazy-enter");
//           done();
//         },
//       }));
//     });
//     inject(
//       ($compile, $rootScope, $browser, $rootElement, $animate, $document) => {
//         $animate.enabled(true);

//         $rootScope.val = "crazy";
//         element = angular.element('<div ng-class="val"></div>');
//         JQLite($document[0].body).append($rootElement);

//         $compile(element)($rootScope);

//         let enterComplete = false;
//         $animate.enter(element, $rootElement, null).then(() => {
//           enterComplete = true;
//         });

//         // jquery doesn't compare both elements properly so let's use the nodes
//         expect(element.parent()[0]).toEqual($rootElement[0]);
//         expect(element[0].classList.contains("crazy")).toBe(false);
//         expect(enterComplete).toBe(false);

//         $rootScope.$digest();
//         $animate.flush();
//         $rootScope.$digest();

//         expect(element[0].classList.contains("crazy")).toBe(true);
//         expect(enterComplete).toBe(true);
//         expect(element.data("state")).toBe("crazy-enter");
//       },
//     );
//   });

//   it("should not remove classes if they're going to be added back right after", () => {
//     module("ngAnimateMock");

//     inject(($rootScope, $compile, $animate) => {
//       let className;

//       $rootScope.one = true;
//       $rootScope.two = true;
//       $rootScope.three = true;

//       element = angular.element(
//         '<div ng-class="{one:one, two:two, three:three}"></div>',
//       );
//       $compile(element)($rootScope);
//       $rootScope.$digest();

//       // this fires twice due to the class observer firing
//       let item = $animate.queue.shift();
//       expect(item.event).toBe("addClass");
//       expect(item.args[1]).toBe("one two three");

//       expect($animate.queue.length).toBe(0);

//       $rootScope.three = false;
//       $rootScope.$digest();

//       item = $animate.queue.shift();
//       expect(item.event).toBe("removeClass");
//       expect(item.args[1]).toBe("three");

//       expect($animate.queue.length).toBe(0);

//       $rootScope.two = false;
//       $rootScope.three = true;
//       $rootScope.$digest();

//       item = $animate.queue.shift();
//       expect(item.event).toBe("addClass");
//       expect(item.args[1]).toBe("three");

//       item = $animate.queue.shift();
//       expect(item.event).toBe("removeClass");
//       expect(item.args[1]).toBe("two");

//       expect($animate.queue.length).toBe(0);
//     });
//   });
// });
