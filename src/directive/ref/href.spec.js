import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";
import { dealoc, jqLite } from "../../jqLite";
import { isDefined } from "../../shared/utils";

describe("ngHref", () => {
  let $rootScope;
  let $compile;
  let element;

  beforeEach(() => {
    publishExternalAPI().decorator("$exceptionHandler", function () {
      return (exception, cause) => {
        throw new Error(exception.message);
      };
    });
    createInjector(["ng"]).invoke((_$rootScope_, _$compile_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  afterEach(() => {
    dealoc(element);
    jqLite.CACHE.clear();
  });

  it("should interpolate the expression and bind to href", () => {
    element = $compile('<a ng-href="some/{{id}}"></div>')($rootScope);
    $rootScope.$digest();
    expect(element.attr("href")).toEqual("some/");

    $rootScope.$apply(() => {
      $rootScope.id = 1;
    });
    expect(element.attr("href")).toEqual("some/1");
  });

  it("should bind href and merge with other attrs", () => {
    element = $compile('<a ng-href="{{url}}" rel="{{rel}}"></a>')($rootScope);
    $rootScope.url = "http://server";
    $rootScope.rel = "REL";
    $rootScope.$digest();
    expect(element.attr("href")).toEqual("http://server");
    expect(element.attr("rel")).toEqual("REL");
  });

  it("should bind href even if no interpolation", () => {
    element = $compile('<a ng-href="http://server"></a>')($rootScope);
    $rootScope.$digest();
    expect(element.attr("href")).toEqual("http://server");
  });

  it("should not set the href if ng-href is empty", () => {
    $rootScope.url = null;
    element = $compile('<a ng-href="{{url}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr("href")).toEqual(undefined);
  });

  it("should remove the href if ng-href changes to empty", () => {
    $rootScope.url = "http://www.google.com/";
    element = $compile('<a ng-href="{{url}}">')($rootScope);
    $rootScope.$digest();

    $rootScope.url = null;
    $rootScope.$digest();
    expect(element.attr("href")).toEqual(undefined);
  });

  it("should sanitize interpolated url", () => {
    /* eslint no-script-url: "off" */
    $rootScope.imageUrl = "javascript:alert(1);";
    element = $compile('<a ng-href="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr("href")).toBe("unsafe:javascript:alert(1);");
  });

  it("should sanitize non-interpolated url", () => {
    element = $compile('<a ng-href="javascript:alert(1);">')($rootScope);
    $rootScope.$digest();
    expect(element.attr("href")).toBe("unsafe:javascript:alert(1);");
  });

  it("should bind numbers", () => {
    element = $compile('<a ng-href="{{1234}}"></a>')($rootScope);
    $rootScope.$digest();
    expect(element.attr("href")).toEqual("1234");
  });

  it("should bind and sanitize the result of a (custom) toString() function", () => {
    $rootScope.value = {};
    element = $compile('<a ng-href="{{value}}"></a>')($rootScope);
    $rootScope.$digest();
    expect(element.attr("href")).toEqual("[object Object]");

    function SafeClass() {}

    SafeClass.prototype.toString = function () {
      return "custom value";
    };

    $rootScope.value = new SafeClass();
    $rootScope.$digest();
    expect(element.attr("href")).toEqual("custom value");

    function UnsafeClass() {}

    UnsafeClass.prototype.toString = function () {
      return "javascript:alert(1);";
    };

    $rootScope.value = new UnsafeClass();
    $rootScope.$digest();
    expect(element.attr("href")).toEqual("unsafe:javascript:alert(1);");
  });

  if (isDefined(window.SVGElement)) {
    describe("SVGAElement", () => {
      it("should interpolate the expression and bind to xlink:href", () => {
        element = $compile('<svg><a ng-href="some/{{id}}"></a></svg>')(
          $rootScope,
        );
        const child = element.children("a");
        $rootScope.$digest();
        expect(child.attr("xlink:href")).toEqual("some/");

        $rootScope.$apply(() => {
          $rootScope.id = 1;
        });
        expect(child.attr("xlink:href")).toEqual("some/1");
      });

      it("should bind xlink:href even if no interpolation", () => {
        element = $compile('<svg><a ng-href="http://server"></a></svg>')(
          $rootScope,
        );
        const child = element.children("a");
        $rootScope.$digest();
        expect(child.attr("xlink:href")).toEqual("http://server");
      });
    });
  }
});
