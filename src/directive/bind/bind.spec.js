import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";
import { dealoc, jqLite } from "../../shared/jqlite/jqlite";

describe("ng-bind", () => {
  let $rootScope;
  let $compile;
  let element;
  let scope;
  let $sce;

  beforeEach(() => {
    publishExternalAPI().decorator("$exceptionHandler", function () {
      return (exception, cause) => {
        throw new Error(exception.message);
      };
    });
    createInjector(["ng"]).invoke((_$rootScope_, _$compile_, _$sce_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $sce = _$sce_;
    });
  });

  afterEach(() => {
    dealoc(element);
    jqLite.CACHE.clear();
  });

  describe("ngBind", () => {
    it("should set text", () => {
      element = $compile('<div ng-bind="a"></div>')($rootScope);
      expect(element.text()).toEqual("");
      $rootScope.a = "misko";
      $rootScope.$digest();
      expect(element.text()).toEqual("misko");
    });

    it("should set text to blank if undefined", () => {
      element = $compile('<div ng-bind="a"></div>')($rootScope);
      $rootScope.a = "misko";
      $rootScope.$digest();
      expect(element.text()).toEqual("misko");
      $rootScope.a = undefined;
      $rootScope.$digest();
      expect(element.text()).toEqual("");
      $rootScope.a = null;
      $rootScope.$digest();
      expect(element.text()).toEqual("");
    });

    it("should suppress rendering of falsy values", () => {
      element = $compile(
        '<div><span ng-bind="null"></span>' +
          '<span ng-bind="undefined"></span>' +
          "<span ng-bind=\"''\"></span>-" +
          '<span ng-bind="0"></span>' +
          '<span ng-bind="false"></span>' +
          "</div>",
      )($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual("-0false");
    });

    [
      [{ a: 1 }, '{"a":1}'],
      [true, "true"],
      [false, "false"],
    ].forEach((prop) => {
      it("should jsonify $prop", () => {
        () => {
          $rootScope.value = prop[0];
          element = $compile('<div ng-bind="value"></div>')($rootScope);
          $rootScope.$digest();
          expect(element.text()).toEqual(prop[1]);
        };
      });
    });

    it("should use custom toString when present", () => {
      $rootScope.value = {
        toString() {
          return "foo";
        },
      };
      element = $compile('<div ng-bind="value"></div>')($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual("foo");
    });

    it("should NOT use toString on array objects", () => {
      $rootScope.value = [];
      element = $compile('<div ng-bind="value"></div>')($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual("[]");
    });

    it("should NOT use toString on Date objects", () => {
      $rootScope.value = new Date(2014, 10, 10, 0, 0, 0);
      element = $compile('<div ng-bind="value"></div>')($rootScope);
      $rootScope.$digest();
      expect(element.text()).toBe(JSON.stringify($rootScope.value));
      expect(element.text()).not.toEqual($rootScope.value.toString());
    });

    it("should one-time bind if the expression starts with two colons", () => {
      element = $compile('<div ng-bind="::a"></div>')($rootScope);
      $rootScope.a = "lucas";
      expect($rootScope.$$watchers.length).toEqual(1);
      $rootScope.$digest();
      expect(element.text()).toEqual("lucas");
      expect($rootScope.$$watchers.length).toEqual(0);
      $rootScope.a = undefined;
      $rootScope.$digest();
      expect(element.text()).toEqual("lucas");
    });

    it("should be possible to bind to a new value within the same $digest", () => {
      element = $compile('<div ng-bind="::a"></div>')($rootScope);
      $rootScope.$watch("a", (newVal) => {
        if (newVal === "foo") {
          $rootScope.a = "bar";
        }
      });
      $rootScope.a = "foo";
      $rootScope.$digest();
      expect(element.text()).toEqual("bar");
      $rootScope.a = undefined;
      $rootScope.$digest();
      expect(element.text()).toEqual("bar");
    });

    it("should remove the binding if the value is defined at the end of a $digest loop", () => {
      element = $compile('<div ng-bind="::a"></div>')($rootScope);
      $rootScope.$watch("a", (newVal) => {
        if (newVal === "foo") {
          $rootScope.a = undefined;
        }
      });
      $rootScope.a = "foo";
      $rootScope.$digest();
      expect(element.text()).toEqual("");
      $rootScope.a = "bar";
      $rootScope.$digest();
      expect(element.text()).toEqual("bar");
      $rootScope.a = "man";
      $rootScope.$digest();
      expect(element.text()).toEqual("bar");
    });
  });

  describe("ngBindTemplate", () => {
    it("should ngBindTemplate", () => {
      element = $compile('<div ng-bind-template="Hello {{name}}!"></div>')(
        $rootScope,
      );
      $rootScope.name = "Misko";
      $rootScope.$digest();
      expect(element.text()).toEqual("Hello Misko!");
    });

    it("should one-time bind the expressions that start with ::", () => {
      element = $compile(
        '<div ng-bind-template="{{::hello}} {{::name}}!"></div>',
      )($rootScope);
      $rootScope.name = "Misko";
      expect($rootScope.$$watchers.length).toEqual(2);
      $rootScope.$digest();
      expect(element.text()).toEqual(" Misko!");
      expect($rootScope.$$watchers.length).toEqual(1);
      $rootScope.hello = "Hello";
      $rootScope.name = "Lucas";
      $rootScope.$digest();
      expect(element.text()).toEqual("Hello Misko!");
      expect($rootScope.$$watchers.length).toEqual(0);
    });

    it("should render object as JSON ignore $$", () => {
      element = $compile('<pre>{{ {key:"value", $$key:"hide"}  }}</pre>')(
        $rootScope,
      );
      $rootScope.$digest();

      expect(JSON.parse(element.text())).toEqual({ key: "value" });
    });
  });

  describe("ngBindHtml", () => {
    it("should complain about accidental use of interpolation", () => {
      expect(() => {
        $compile('<div ng-bind-html="{{myHtml}}"></div>');
        $rootScope.$digest();
      }).toThrowError(/syntax/);
    });

    describe("SCE disabled", () => {
      beforeEach(() => {
        createInjector([
          "ng",
          ($sceProvider) => {
            $sceProvider.enabled(false);
          },
        ]).invoke((_$rootScope_, _$compile_, _$sce_) => {
          $rootScope = _$rootScope_;
          $compile = _$compile_;
          $sce = _$sce_;
        });
      });

      afterEach(() => dealoc(element));

      it("should set html", () => {
        element = $compile('<div ng-bind-html="html"></div>')($rootScope);
        $rootScope.html = '<div onclick="">hello</div>';
        $rootScope.$digest();
        expect(element.html()).toEqual('<div onclick="">hello</div>');
      });

      it("should update html", () => {
        element = $compile('<div ng-bind-html="html"></div>')($rootScope);
        $rootScope.html = "hello";
        $rootScope.$digest();
        expect(element.html()).toEqual("hello");
        $rootScope.html = "goodbye";
        $rootScope.$digest();
        expect(element.html()).toEqual("goodbye");
      });

      it("should one-time bind if the expression starts with two colons", () => {
        element = $compile('<div ng-bind-html="::html"></div>')($rootScope);
        $rootScope.html = '<div onclick="">hello</div>';
        expect($rootScope.$$watchers.length).toEqual(1);
        $rootScope.$digest();
        expect(element.text()).toEqual("hello");
        expect($rootScope.$$watchers.length).toEqual(0);
        $rootScope.html = '<div onclick="">hello</div>';
        $rootScope.$digest();
        expect(element.text()).toEqual("hello");
      });
    });

    describe("SCE enabled", () => {
      beforeEach(() => {
        createInjector([
          "ng",
          ($sceProvider) => {
            $sceProvider.enabled(true);
          },
        ]).invoke((_$rootScope_, _$compile_, _$sce_) => {
          $rootScope = _$rootScope_;
          $compile = _$compile_;
          $sce = _$sce_;
        });
        scope = $rootScope.$new();
      });

      afterEach(() => dealoc(element));

      it("should set html for trusted values", () => {
        element = $compile('<div ng-bind-html="html"></div>')($rootScope);
        $rootScope.html = $sce.trustAsHtml('<div onclick="">hello</div>');
        $rootScope.$digest();
        expect(element.html()).toEqual('<div onclick="">hello</div>');
      });

      it("should update html", () => {
        element = $compile('<div ng-bind-html="html"></div>')(scope);
        scope.html = $sce.trustAsHtml("hello");
        scope.$digest();
        expect(element.html()).toEqual("hello");
        scope.html = $sce.trustAsHtml("goodbye");
        scope.$digest();
        expect(element.html()).toEqual("goodbye");
      });

      it("should not cause infinite recursion for trustAsHtml object watches", () => {
        // Ref: https://github.com/angular/angular.js/issues/3932
        // If the binding is a function that creates a new value on every call via trustAs, we'll
        // trigger an infinite digest if we don't take care of it.
        element = $compile('<div ng-bind-html="getHtml()"></div>')($rootScope);
        $rootScope.getHtml = function () {
          return $sce.trustAsHtml('<div onclick="">hello</div>');
        };
        $rootScope.$digest();
        expect(element.html()).toEqual('<div onclick="">hello</div>');
      });

      it("should handle custom $sce objects", () => {
        function MySafeHtml(val) {
          this.val = val;
        }

        let injector = createInjector([
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
        ]).invoke((_$rootScope_, _$compile_, _$sce_) => {
          $rootScope = _$rootScope_.$new();
          $compile = _$compile_;
          $sce = _$sce_;
        });

        () => {
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
          $rootScope.$digest();
          expect(element.html()).toEqual("hello");
          html = "goodbye";
          $rootScope.$digest();
          expect(element.html()).toEqual("goodbye");
        };
      });
    });
  });
});
