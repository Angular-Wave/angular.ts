import { dealoc } from "../../shared/jqlite/jqlite";
import { Angular } from "../../loader";

describe("ngList", () => {
  let $rootScope;
  let element;
  let $compile;
  let injector;
  let inputElm;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular.module("test", []);
    injector = window.angular.bootstrap(document.getElementById("dummy"), [
      "test",
    ]);
    $compile = injector.get("$compile");
    $rootScope = injector.get("$rootScope");
  });

  afterEach(() => {
    dealoc(element);
  });

  function changeInputValue(val) {
    inputElm[0].value = val;
    inputElm[0].dispatchEvent(new Event("change"));
  }

  it("should parse text into an array", () => {
    inputElm = $compile('<input type="text" ng-model="list" ng-list />')(
      $rootScope,
    );

    // model -> view
    $rootScope.$apply("list = ['x', 'y', 'z']");
    expect(inputElm.val()).toBe("x, y, z");

    // view -> model
    changeInputValue("1, 2, 3");
    expect($rootScope.list).toEqual(["1", "2", "3"]);
  });

  it("should not clobber text if model changes due to itself", () => {
    // When the user types 'a,b' the 'a,' stage parses to ['a'] but if the
    // $parseModel function runs it will change to 'a', in essence preventing
    // the user from ever typing ','.
    inputElm = $compile('<input type="text" ng-model="list" ng-list />')(
      $rootScope,
    );

    changeInputValue("a ");
    expect(inputElm.val()).toEqual("a ");
    expect($rootScope.list).toEqual(["a"]);

    changeInputValue("a ,");
    expect(inputElm.val()).toEqual("a ,");
    expect($rootScope.list).toEqual(["a"]);

    changeInputValue("a , ");
    expect(inputElm.val()).toEqual("a , ");
    expect($rootScope.list).toEqual(["a"]);

    changeInputValue("a , b");
    expect(inputElm.val()).toEqual("a , b");
    expect($rootScope.list).toEqual(["a", "b"]);
  });

  it("should convert empty string to an empty array", () => {
    inputElm = $compile('<input type="text" ng-model="list" ng-list />')(
      $rootScope,
    );

    changeInputValue("");
    expect($rootScope.list).toEqual([]);
  });

  it("should be invalid if required and empty", () => {
    inputElm = $compile('<input type="text" ng-list ng-model="list" required>')(
      $rootScope,
    );
    changeInputValue("");
    expect($rootScope.list).toBeUndefined();
    expect(inputElm[0].classList.contains("ng-invalid")).toBeTrue();
    changeInputValue("a,b");
    expect($rootScope.list).toEqual(["a", "b"]);
    expect(inputElm[0].classList.contains("ng-valid")).toBeTrue();
  });

  describe("with a custom separator", () => {
    it("should split on the custom separator", () => {
      inputElm = $compile('<input type="text" ng-model="list" ng-list=":" />')(
        $rootScope,
      );

      changeInputValue("a,a");
      expect($rootScope.list).toEqual(["a,a"]);

      changeInputValue("a:b");
      expect($rootScope.list).toEqual(["a", "b"]);
    });

    it("should join the list back together with the custom separator", () => {
      inputElm = $compile(
        '<input type="text" ng-model="list" ng-list=" : " />',
      )($rootScope);

      $rootScope.$apply(() => {
        $rootScope.list = ["x", "y", "z"];
      });
      expect(inputElm.val()).toBe("x : y : z");
    });
  });

  describe("(with ngTrim undefined or true)", () => {
    it("should ignore separator whitespace when splitting", () => {
      inputElm = $compile(
        '<input type="text" ng-model="list" ng-list="  |  " />',
      )($rootScope);

      changeInputValue("a|b");
      expect($rootScope.list).toEqual(["a", "b"]);
    });

    it("should trim whitespace from each list item", () => {
      inputElm = $compile('<input type="text" ng-model="list" ng-list="|" />')(
        $rootScope,
      );

      changeInputValue("a | b");
      expect($rootScope.list).toEqual(["a", "b"]);
    });
  });

  describe("(with ngTrim set to false)", () => {
    it("should use separator whitespace when splitting", () => {
      inputElm = $compile(
        '<input type="text" ng-model="list" ng-trim="false" ng-list="  |  " />',
      )($rootScope);

      changeInputValue("a|b");
      expect($rootScope.list).toEqual(["a|b"]);

      changeInputValue("a  |  b");
      expect($rootScope.list).toEqual(["a", "b"]);
    });

    it("should not trim whitespace from each list item", () => {
      inputElm = $compile(
        '<input type="text" ng-model="list" ng-trim="false" ng-list="|" />',
      )($rootScope);
      changeInputValue("a  |  b");
      expect($rootScope.list).toEqual(["a  ", "  b"]);
    });

    it("should support splitting on newlines", () => {
      inputElm = $compile(
        '<textarea type="text" ng-model="list" ng-trim="false" ng-list="&#10;"></textarea>',
      )($rootScope);
      changeInputValue("a\nb");
      expect($rootScope.list).toEqual(["a", "b"]);
    });

    it("should support splitting on whitespace", () => {
      inputElm = $compile(
        '<textarea type="text" ng-model="list" ng-trim="false" ng-list=" "></textarea>',
      )($rootScope);
      changeInputValue("a b");
      expect($rootScope.list).toEqual(["a", "b"]);
    });
  });
});
