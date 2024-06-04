import { dealoc, jqLite } from "../../src/jqLite";
import { forEach, valueFn } from "../../src/shared/utils";
import { publishExternalAPI } from "../../src/public";
import { createInjector } from "../../src/injector";
import { Angular } from "../../src/loader";

describe("ngIf", () => {
  describe("basic", () => {
    let $scope;
    let $compile;
    let element;
    let $compileProvider;
    let $rootScope;
    let injector;
    let angular;

    beforeEach(function () {
      angular = new Angular();
      publishExternalAPI();
      injector = createInjector([
        "ng",
        function (_$compileProvider_) {
          $compileProvider = _$compileProvider_;
        },
      ]);
      injector.invoke((_$rootScope_, _$compile_) => {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $compile = _$compile_;
        element = $compile("<div></div>")($scope);
      });
    });

    afterEach(() => {
      dealoc(element);
    });

    function makeIf() {
      forEach(arguments, (expr) => {
        element.append(
          $compile(`<div class="my-class" ng-if="${expr}"><div>Hi</div></div>`)(
            $scope,
          ),
        );
      });
      $scope.$apply();
    }

    it("should immediately remove the element if condition is falsy", () => {
      makeIf("false", "undefined", "null", "NaN", "''", "0");
      expect(element.children().length).toBe(0);
    });

    it("should leave the element if condition is true", () => {
      makeIf("true");
      expect(element.children().length).toBe(1);
    });

    it("should leave the element if the condition is a non-empty string", () => {
      makeIf("'f'", "'0'", "'false'", "'no'", "'n'", "'[]'");
      expect(element.children().length).toBe(6);
    });

    it("should leave the element if the condition is an object", () => {
      makeIf("[]", "{}");
      expect(element.children().length).toBe(2);
    });

    it("should not add the element twice if the condition goes from true to true", () => {
      $scope.hello = "true1";
      makeIf("hello");
      expect(element.children().length).toBe(1);
      $scope.$apply('hello = "true2"');
      expect(element.children().length).toBe(1);
    });

    it("should not recreate the element if the condition goes from true to true", () => {
      $scope.hello = "true1";
      makeIf("hello");
      element.children().data("flag", true);
      $scope.$apply('hello = "true2"');
      expect(element.children().data("flag")).toBe(true);
    });

    it("should create then remove the element if condition changes", () => {
      $scope.hello = true;
      makeIf("hello");
      expect(element.children().length).toBe(1);
      $scope.$apply("hello = false");
      expect(element.children().length).toBe(0);
    });

    it("should create a new scope every time the expression evaluates to true", () => {
      $scope.$apply("value = true");
      element.append(
        $compile(
          '<div ng-if="value"><span ng-init="value=false"></span></div>',
        )($scope),
      );
      $scope.$apply();
      expect(element.children("div").length).toBe(1);
    });

    it("should destroy the child scope every time the expression evaluates to false", () => {
      $scope.value = true;
      element.append($compile('<div ng-if="value"></div>')($scope));
      $scope.$apply();

      const childScope = $scope.$$childHead;
      let destroyed = false;

      childScope.$on("$destroy", () => {
        destroyed = true;
      });

      $scope.value = false;
      $scope.$apply();

      expect(destroyed).toBe(true);
    });

    it("should play nice with other elements beside it", () => {
      $scope.values = [1, 2, 3, 4];
      element.append(
        $compile(
          '<div ng-repeat="i in values"></div>' +
            '<div ng-if="values.length==4"></div>' +
            '<div ng-repeat="i in values"></div>',
        )($scope),
      );
      $scope.$apply();
      expect(element.children().length).toBe(9);
      $scope.$apply("values.splice(0,1)");
      expect(element.children().length).toBe(6);
      $scope.$apply("values.push(1)");
      expect(element.children().length).toBe(9);
    });

    it("should play nice with ngInclude on the same element", (done) => {
      element = jqLite(
        `<div><div ng-if="value=='first'" ng-include="'/mock/hello'"></div></div>`,
      );

      window.angular.module("myModule", []).run(($rootScope) => {
        $rootScope.value = "first";
      });
      injector = angular.bootstrap(element, ["myModule"]);

      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toBe("Hello");
        done();
      }, 100);
    });

    it("should work with multiple elements", () => {
      $scope.show = true;
      $scope.things = [1, 2, 3];
      element.append(
        $compile(
          "<div><div>before;</div>" +
            '<div ng-if-start="show">start;</div>' +
            '<div ng-repeat="thing in things">{{thing}};</div>' +
            "<div ng-if-end>end;</div>" +
            "<div>after;</div></div>",
        )($scope),
      );
      $scope.$apply();
      expect(element.text()).toBe("before;start;1;2;3;end;after;");

      $scope.things.push(4);
      $scope.$apply();
      expect(element.text()).toBe("before;start;1;2;3;4;end;after;");

      $scope.show = false;
      $scope.$apply();
      // expect(element.text()).toBe("before;after;");
    });

    it("should restore the element to its compiled state", () => {
      $scope.value = true;
      makeIf("value");
      expect(element.children().length).toBe(1);
      element.children()[0].classList.remove("my-class");
      expect(element.children()[0].className).not.toContain("my-class");
      $scope.$apply("value = false");
      expect(element.children().length).toBe(0);
      $scope.$apply("value = true");
      expect(element.children().length).toBe(1);
      expect(element.children()[0].className).toContain("my-class");
    });

    it("should work when combined with an ASYNC template that loads after the first digest", (done) => {
      $compileProvider.directive("test", () => ({
        templateUrl: "/test.html",
      }));
      element.append('<div ng-if="show" test></div>');
      $compile(element)($rootScope);
      $rootScope.show = true;
      expect(element.text()).toBe("");
      $rootScope.$apply();
      setTimeout(() => {
        expect(element.text()).toBe("hello");
        $rootScope.show = false;
        $rootScope.$apply();
        expect(element.children().length).toBe(0);
        expect(element.text()).toBe("");
        done();
      }, 100);
      expect(element.text()).toBe("");
    });

    it("should not trigger a digest when the element is removed", () => {
      const spy = spyOn($rootScope, "$digest").and.callThrough();
      let $timeout = injector.get("$timeout");
      $scope.hello = true;
      makeIf("hello");
      expect(element.children().length).toBe(1);
      $scope.$apply("hello = false");
      spy.calls.reset();
      expect(element.children().length).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    describe("and transcludes", () => {
      it("should allow access to directive controller from children when used in a replace template", () => {
        let controller;
        const { directive } = $compileProvider;
        directive(
          "template",
          valueFn({
            template: '<div ng-if="true"><span test></span></div>',
            replace: true,
            controller() {
              this.flag = true;
            },
          }),
        );
        directive(
          "test",
          valueFn({
            require: "^template",
            link(scope, el, attr, ctrl) {
              controller = ctrl;
            },
          }),
        );
        $compile("<div><div template></div></div>")($rootScope);
        $rootScope.$apply();
        expect(controller.flag).toBe(true);
      });

      it("should use the correct transcluded scope", () => {
        $compileProvider.directive(
          "iso",
          valueFn({
            link(scope) {
              scope.val = "value in iso scope";
            },
            restrict: "E",
            transclude: true,
            template:
              '<div ng-if="true">val={{val}}-<div ng-transclude></div></div>',
            scope: {},
          }),
        );
        $rootScope.val = "transcluded content";
        const element = $compile('<iso><span ng-bind="val"></span></iso>')(
          $rootScope,
        );
        $rootScope.$digest();
        expect(element.text().trim()).toEqual(
          "val=value in iso scope-transcluded content",
        );
      });
    });

    // TODO ANIMATIONS
    // describe("and animations", () => {
    //   let body = document.getElementById("dummy");
    //   let element;
    //   let $rootElement;

    //   function html(content) {
    //     $rootElement.html(content);
    //     element = $rootElement.children().eq(0);
    //     return element;
    //   }

    //   afterEach(() => {
    //     dealoc(body);
    //     dealoc(element);
    //   });

    //   // beforeEach(
    //   //   module(
    //   //     ($animateProvider, $provide) =>
    //   //       function ($animate) {
    //   //         $animate.enabled(true);
    //   //       },
    //   //   ),
    //   // );

    //   it("should fire off the enter animation", () => {
    //     body.innerHTML =
    //       "<div>" + '<div ng-if="value"><div>Hi</div></div>' + "</div>";

    //     let item;
    //     const $scope = $rootScope.$new();
    //     element = $compile(body)($scope);

    //     $rootScope.$digest();
    //     $scope.$apply("value = true");

    //     item = $animate.queue.shift();
    //     expect(item.event).toBe("enter");
    //     expect(item.element.text()).toBe("Hi");

    //     expect(element.children().length).toBe(1);
    //   });

    //   it("should fire off the leave animation", () => {
    //     let item;
    //     const $scope = $rootScope.$new();
    //     element = $compile(
    //       html("<div>" + '<div ng-if="value"><div>Hi</div></div>' + "</div>"),
    //     )($scope);
    //     $scope.$apply("value = true");

    //     item = $animate.queue.shift();
    //     expect(item.event).toBe("enter");
    //     expect(item.element.text()).toBe("Hi");

    //     expect(element.children().length).toBe(1);
    //     $scope.$apply("value = false");

    //     item = $animate.queue.shift();
    //     expect(item.event).toBe("leave");
    //     expect(item.element.text()).toBe("Hi");

    //     expect(element.children().length).toBe(0);
    //   });

    //   it("should destroy the previous leave animation if a new one takes place", () => {
    //     module(($provide) => {
    //       $provide.decorator("$animate", ($delegate, $$q) => {
    //         const emptyPromise = $$q.defer().promise;
    //         emptyPromise.done = () => {};

    //         $delegate.leave = function () {
    //           return emptyPromise;
    //         };
    //         return $delegate;
    //       });
    //     });
    //     inject(($compile, $rootScope, $animate) => {
    //       let item;
    //       const $scope = $rootScope.$new();
    //       element = $compile(
    //         html("<div>" + '<div ng-if="value">Yo</div>' + "</div>"),
    //       )($scope);

    //       $scope.$apply("value = true");

    //       let destroyed;
    //       const inner = element.children(0);
    //       inner.on("$destroy", () => {
    //         destroyed = true;
    //       });

    //       $scope.$apply("value = false");

    //       $scope.$apply("value = true");

    //       $scope.$apply("value = false");

    //       expect(destroyed).toBe(true);
    //     });
    //   });

    //   it("should work with svg elements when the svg container is transcluded", () => {
    //     // module(($compileProvider) => {
    //     //   $compileProvider.directive("svgContainer", () => ({
    //     //     template: "<svg ng-transclude></svg>",
    //     //     replace: true,
    //     //     transclude: true,
    //     //   });
    //     // });

    //     element = $compile(
    //       '<svg-container><circle ng-if="flag"></circle></svg-container>',
    //     )($rootScope);
    //     $rootScope.flag = true;
    //     $rootScope.$apply();

    //     const circle = element.find("circle");
    //     expect(circle[0].toString()).toMatch(/SVG/);
    //   });
    // });
  });
});
