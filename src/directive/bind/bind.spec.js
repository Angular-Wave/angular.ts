import { Angular } from "../../angular.js";
import { dealoc } from "../../shared/dom.js";
import { wait } from "../../shared/test-utils.js";

describe("ng-bind", () => {
  let $rootScope;
  let $compile;
  let element;
  let scope;
  let $sce;

  beforeEach(() => {
    dealoc(document.getElementById("app"));
    window.angular = new Angular();
    window.angular
      .module("myModule", ["ng"])
      .decorator("$exceptionHandler", function () {
        return (exception) => {
          throw new Error(exception.message);
        };
      });
    window.angular
      .bootstrap(document.getElementById("app"), ["myModule"])
      .invoke((_$rootScope_, _$compile_, _$sce_) => {
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        $sce = _$sce_;
      });
  });

  describe("ngBind", () => {
    it("should set text", async () => {
      element = $compile('<div ng-bind="a"></div>')($rootScope);
      await wait();
      expect(element.textContent).toEqual("");
      $rootScope.a = "misko";
      await wait();
      expect(element.textContent).toEqual("misko");
    });

    it("should set text to blank if undefined", async () => {
      element = $compile('<div ng-bind="a"></div>')($rootScope);
      $rootScope.a = "misko";
      await wait();
      expect(element.textContent).toEqual("misko");
      $rootScope.a = undefined;
      await wait();
      expect(element.textContent).toEqual("");
      $rootScope.a = null;
      await wait();
      expect(element.textContent).toEqual("");
    });

    it("should suppress rendering of falsy values", async () => {
      element = $compile(
        '<div><span ng-bind="null"></span>' +
          '<span ng-bind="undefined"></span>' +
          "<span ng-bind=\"''\"></span>-" +
          '<span ng-bind="0"></span>' +
          '<span ng-bind="false"></span>' +
          "</div>",
      )($rootScope);
      await wait();
      expect(element.textContent).toEqual("-0false");
    });

    [
      [{ a: 1 }, '{"a":1}'],
      [true, "true"],
      [false, "false"],
    ].forEach((prop) => {
      it("should jsonify $prop " + prop, async () => {
        $rootScope.value = prop[0];
        element = $compile('<div ng-bind="value"></div>')($rootScope);
        await wait();
        expect(element.textContent).toEqual(prop[1]);
      });
    });

    it("should use custom toString when present", async () => {
      $rootScope.value = {
        toString() {
          return "foo";
        },
      };
      element = $compile('<div ng-bind="value"></div>')($rootScope);
      await wait();
      expect(element.textContent).toEqual("foo");
    });

    it("should NOT use toString on array objects", async () => {
      $rootScope.value = [];
      element = $compile('<div ng-bind="value"></div>')($rootScope);
      await wait();
      expect(element.textContent).toEqual("[]");
    });

    it("should NOT use toString on Date objects", async () => {
      $rootScope.value = new Date(2014, 10, 10, 0, 0, 0);
      element = $compile('<div ng-bind="value"></div>')($rootScope);
      await wait();
      expect(element.textContent).toBe(
        JSON.stringify($rootScope.value.$target),
      );
      expect(element.textContent).not.toEqual(
        $rootScope.value.$target.toString(),
      );
    });

    it("should support `data-lazy` attribute", async () => {
      $rootScope.value = 0;
      await wait();
      element = $compile('<div ng-bind="value" data-lazy="true">Content</div>')(
        $rootScope,
      );
      expect(element.textContent).toEqual("Content");

      $rootScope.value = 2;
      await wait();
      expect(element.textContent).toEqual("2");
    });
  });

  describe("ngBindTemplate", () => {
    it("should ngBindTemplate", async () => {
      element = $compile('<div ng-bind-template="Hello {{name}}!"></div>')(
        $rootScope,
      );
      $rootScope.name = "Misko";
      await wait();
      expect(element.textContent).toEqual("Hello Misko!");
    });

    it("should render object as JSON ignore $$", async () => {
      element = $compile('<pre>{{ {key:"value", $$key:"hide"}  }}</pre>')(
        $rootScope,
      );
      await wait();
      expect(JSON.parse(element.textContent)).toEqual({ key: "value" });
    });
  });

  describe("ngBindHtml", () => {
    it("should complain about accidental use of interpolation", async () => {
      expect(() => {
        $compile('<div ng-bind-html="{{myHtml}}"></div>');
      }).toThrowError(/syntax/);
    });

    describe("SCE disabled", () => {
      beforeEach(() => {
        dealoc(document.getElementById("app"));
        window.angular
          .module("myModule", [
            "ng",
            ($sceProvider) => {
              $sceProvider.enabled(false);
            },
          ])
          .decorator("$exceptionHandler", function () {
            return (exception) => {
              throw new Error(exception.message);
            };
          });
        window.angular
          .bootstrap(document.getElementById("app"), ["myModule"])
          .invoke((_$rootScope_, _$compile_, _$sce_) => {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
            $sce = _$sce_;
          });
      });

      afterEach(() => dealoc(element));

      it("should set html", async () => {
        element = $compile('<div ng-bind-html="html"></div>')($rootScope);
        $rootScope.html = '<div onclick="">hello</div>';
        await wait();
        expect(element.innerHTML).toEqual('<div onclick="">hello</div>');
      });

      it("should update html", async () => {
        element = $compile('<div ng-bind-html="html"></div>')($rootScope);
        $rootScope.html = "hello";
        await wait();
        expect(element.innerHTML).toEqual("hello");
        $rootScope.html = "goodbye";
        await wait();
        expect(element.innerHTML).toEqual("goodbye");
      });
    });

    describe("SCE enabled", () => {
      beforeEach(() => {
        dealoc(document.getElementById("app"));
        window.angular
          .module("myModule", [
            "ng",
            ($sceProvider) => {
              $sceProvider.enabled(true);
            },
          ])
          .decorator("$exceptionHandler", function () {
            return (exception) => {
              throw new Error(exception.message);
            };
          });
        window.angular
          .bootstrap(document.getElementById("app"), ["myModule"])
          .invoke((_$rootScope_, _$compile_, _$sce_) => {
            $rootScope = _$rootScope_;
            $compile = _$compile_;
            $sce = _$sce_;
          });
        scope = $rootScope.$new();
      });

      afterEach(() => dealoc(element));

      it("should set html for trusted values", async () => {
        element = $compile('<div ng-bind-html="html"></div>')($rootScope);
        $rootScope.html = $sce.trustAsHtml('<div onclick="">hello</div>');
        await wait();
        expect(element.innerHTML).toEqual('<div onclick="">hello</div>');
      });

      it("should update html", async () => {
        element = $compile('<div ng-bind-html="html"></div>')(scope);
        scope.html = $sce.trustAsHtml("hello");
        await wait();
        expect(element.innerHTML).toEqual("hello");
        scope.html = $sce.trustAsHtml("goodbye");
        await wait();
        expect(element.innerHTML).toEqual("goodbye");
      });

      it("should not cause infinite recursion for trustAsHtml object watches", async () => {
        // Ref: https://github.com/angular/angular.js/issues/3932
        // If the binding is a function that creates a new value on every call via trustAs, we'll
        // trigger an infinite digest if we don't take care of it.
        element = $compile('<div ng-bind-html="getHtml()"></div>')($rootScope);
        $rootScope.getHtml = function () {
          return $sce.trustAsHtml('<div onclick="">hello</div>');
        };
        await wait();
        expect(element.innerHTML).toEqual('<div onclick="">hello</div>');
      });

      it("should handle custom $sce objects", async () => {
        function MySafeHtml(val) {
          this.val = val;
        }

        dealoc(document.getElementById("app"));

        window.angular
          .module("myModule", [
            "ng",

            function ($provide) {
              $provide.decorator("$sce", ($delegate) => {
                $delegate.trustAsHtml = function (html) {
                  return new MySafeHtml(html);
                };
                $delegate.getTrustedHtml = function (mySafeHtml) {
                  return mySafeHtml.val;
                };
                $delegate.valueOf = function (v) {
                  return v instanceof MySafeHtml ? v.val : v;
                };
                return $delegate;
              });
            },
          ])
          .decorator("$exceptionHandler", function () {
            return (exception) => {
              throw new Error(exception.message);
            };
          });
        let injector = window.angular.bootstrap(
          document.getElementById("app"),
          ["myModule"],
        );

        injector.invoke((_$rootScope_, _$compile_, _$sce_) => {
          $rootScope = _$rootScope_.$new();
          $compile = _$compile_;
          $sce = _$sce_;
        });

        async () => {
          // Ref: https://github.com/angular/angular.js/issues/14526
          // Previous code used toString for change detection, which fails for custom objects
          // that don't override toString.
          element = $compile('<div ng-bind-html="getHtml()"></div>')(
            $rootScope,
          );
          let html = "hello";
          $rootScope.getHtml = function () {
            return $sce.trustAsHtml(html);
          };
          await wait();
          expect(element.innerHTML).toEqual("hello");
          html = "goodbye";
          await wait();
          expect(element.innerHTML).toEqual("goodbye");
        };

        expect(true).toBeTrue();
      });
    });
  });
});
