import { Angular } from "../../loader.js";
import { createInjector } from "../di/injector.js";
import {
  dealoc,
  getCacheData,
  setCacheData,
  createElementFromHTML as $,
  getController,
  getScope,
  getIsolateScope,
} from "../../shared/dom.js";
import {
  isFunction,
  isElement,
  getNodeName,
  extend,
  assert,
} from "../../shared/utils.js";
import { Cache } from "../../shared/cache.js";
import { wait } from "../../shared/test-utils.js";

function isUnknownElement(el) {
  return !!el.toString().match(/Unknown/);
}

function isSVGElement(el) {
  return !!el.toString().match(/SVG/);
}

function isHTMLElement(el) {
  return !!el.toString().match(/HTML/);
}

function getChildScopes(scope) {
  let children = [];
  if (!scope.$children[0]) {
    return children;
  }
  let childScope = scope.$children[0];
  do {
    children.push(childScope);
    children = children.concat(getChildScopes(childScope));
  } while ((childScope = childScope.$$nextSibling));
  return children;
}

const ELEMENT = document.getElementById("app");
window.ELEMENT = ELEMENT;

/**
 * Helper for bootstraping content onto default element
 */
function bootstrap(htmlContent, moduleName) {
  dealoc(ELEMENT);
  ELEMENT.innerHTML = htmlContent;
  return angular.bootstrap(ELEMENT, [moduleName || "myModule"]);
}

describe("$compile", () => {
  let $rootScope,
    injector,
    defaultModule,
    element,
    $compile,
    $templateCache,
    log,
    $sce;

  /** @type {import("../di/ng-module.js").NgModule} */
  let myModule;

  /** @type {import("../di/ng-module.js").NgModule} */
  let module;

  /** @type {Angular} */
  let angular;

  beforeEach(() => {
    dealoc(ELEMENT);
    log = [];
    bootstrapDefaultApplication();
  });

  afterEach(() => {
    dealoc(ELEMENT);
  });

  function bootstrapDefaultApplication() {
    Cache.clear();
    angular = new Angular();
    module = window.angular.module("test1", ["ng"]);
    defaultModule = window.angular.module("defaultModule", ["ng"]);
    myModule = window.angular.module("myModule", ["ng"]);
    injector = window.angular.bootstrap(ELEMENT, ["defaultModule"]);
    $rootScope = injector.get("$rootScope");
    $compile = injector.get("$compile");
    $templateCache = injector.get("$templateCache");
    $sce = injector.get("$sce");
  }

  function registerDirectives() {
    const args = arguments;
    myModule = window.angular.module("myModule", [
      "ng",
      function ($compileProvider) {
        $compileProvider.directive.apply($compileProvider, args);
      },
    ]);
  }

  function registerComponent(name, options) {
    myModule.component(name, options);
  }

  function registerDefaultDirectives() {
    return registerDirectives({
      log: () => ({
        restrict: "A",
        priority: 0,
        compile: () => (scope, element, attrs) => {
          log.push(attrs.log || "LOG");
        },
      }),

      highLog: () => ({
        restrict: "A",
        priority: 3,
        compile: () => (scope, element, attrs) => {
          log.push(attrs.highLog || "HIGH");
        },
      }),

      mediumLog: () => ({
        restrict: "A",
        priority: 2,
        compile: () => (scope, element, attrs) => {
          log.push(attrs.mediumLog || "MEDIUM");
        },
      }),

      greet: () => ({
        restrict: "A",
        priority: 10,
        compile: () => (scope, element, attrs) => {
          element.innerText = `Hello ${attrs.greet}`;
        },
      }),

      set: () => (scope, element, attrs) => {
        element.innerText = attrs.set;
      },

      mediumStop: () => ({
        priority: 2,
        terminal: true,
      }),

      stop: () => ({
        terminal: true,
      }),

      negativeStop: () => ({
        priority: -100, // even with negative priority we still should be able to stop descend
        terminal: true,
      }),

      svgContainer: () => ({
        template: '<svg width="400" height="400" ng-transclude></svg>',
        replace: true,
        transclude: true,
      }),

      svgCustomTranscludeContainer: () => ({
        template: '<svg width="400" height="400"></svg>',
        transclude: true,
        link(scope, element, attr, ctrls, $transclude) {
          const futureParent = element.firstChild;
          $transclude((clone) => {
            futureParent.append(clone);
          }, futureParent);
        },
      }),

      svgCircle: () => ({
        template: '<circle cx="2" cy="2" r="1"></circle>',
        templateNamespace: "svg",
        replace: true,
      }),

      myForeignObject: () => ({
        template:
          '<foreignObject width="100" height="100" ng-transclude></foreignObject>',
        templateNamespace: "svg",
        replace: true,
        transclude: true,
      }),
    });
  }

  /**
   * To simplify registration of new dependencies, a default module is created before each test, and additional
   * dependencies are loaded into our main module ("myModule"). The lazy loading updates all injectables to invoke
   * the newly-registered injecables.
   */
  function reloadModules() {
    injector.loadNewModules(["myModule"]);
  }

  function initInjector(name) {
    dealoc(document.getElementById("app"));
    injector = window.angular.bootstrap(document.getElementById("app"), [name]);
    reloadInjector();
  }

  function reloadInjector() {
    $rootScope = injector.get("$rootScope");
    $compile = injector.get("$compile");
    $templateCache = injector.get("$templateCache");
    $sce = injector.get("$sce");
  }

  it("is provided by injector $compile", () => {
    expect(injector.get("$compile")).toBeDefined();
  });

  it("allows creating directives", () => {
    myModule.directive("testing", () => {});
    reloadModules();
    expect(injector.has("testingDirective")).toBe(true);
  });

  it("allows creating many directives with the same name", () => {
    myModule.directive("testing", () => ({ d: "one" }));
    myModule.directive("testing", () => ({ d: "two" }));
    reloadModules();
    const result = injector.get("testingDirective");
    expect(result.length).toBe(2);
    expect(result[0].d).toEqual("one");
    expect(result[1].d).toEqual("two");
  });

  it("does not allow a directive called hasOwnProperty", () => {
    myModule.directive("hasOwnProperty", () => {});
    expect(() => {
      reloadModules();
    }).toThrowError();
  });

  it("allows creating directives with object notation", () => {
    myModule.directive({
      a: () => {},
      b: () => {},
      c: () => {},
    });
    reloadModules();

    expect(injector.has("aDirective")).toBe(true);
    expect(injector.has("bDirective")).toBe(true);
    expect(injector.has("cDirective")).toBe(true);
  });

  it("passes an element to directive compile", () => {
    let el;
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          el = element;
        },
      };
    });
    reloadModules();
    $compile("<my-directive></my-directive>");
    expect(el instanceof Element).toBe(true);
  });

  it("compiles element directives from a single element", () => {
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          setCacheData(element, "hasCompiled", true);
        },
      };
    });
    reloadModules();

    const el = $("<my-directive></my-directive>");
    $compile(el);
    expect(getCacheData(el, "hasCompiled")).toBe(true);
  });

  it("compiles element directives found from several elements", () => {
    let idx = 1;
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          setCacheData(element, "idx", idx++);
        },
      };
    });
    reloadModules();
    const el = $(
      "<div><my-directive></my-directive><my-directive></my-directive></div>",
    );
    $compile(el);
    expect(getCacheData(el.childNodes[0], "idx")).toBe(1);
    expect(getCacheData(el.childNodes[1], "idx")).toBe(2);
  });

  it("compiles element directives from child elements", () => {
    let idx = 1;
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          setCacheData(element, "dir", idx++);
        },
      };
    });
    reloadModules();

    const el = $("<div><my-directive></my-directive></div>");
    $compile(el);
    expect(getCacheData(el, "dir")).toBeUndefined();

    expect(getCacheData(el.firstChild, "dir")).toBe(1);
  });

  it("compiles nested directives", () => {
    let idx = 1;
    myModule.directive("myDir", () => {
      return {
        compile: function (element) {
          setCacheData(element, "dir", idx++);
        },
      };
    });
    reloadModules();
    const el = $("<my-dir><my-dir><my-dir></my-dir></my-dir></my-dir>");
    $compile(el);
    expect(getCacheData(el, "dir")).toBe(1);
    expect(getCacheData(el.firstChild, "dir")).toBe(2);
    expect(getCacheData(el.firstChild.firstChild, "dir")).toBe(3);
  });

  ["data"].forEach((prefix) => {
    ["-"].forEach((delim) => {
      it(
        "compiles element directives with " + prefix + delim + " prefix",
        () => {
          myModule.directive("myDirective", () => {
            return {
              compile: function (element) {
                setCacheData(element, "hasCompiled", true);
              },
            };
          });
          reloadModules();
          const el = $(
            "<" +
              prefix +
              delim +
              "my-directive></" +
              prefix +
              delim +
              "my-directive>",
          );
          $compile(el);
          expect(getCacheData(el, "hasCompiled")).toBe(true);
        },
      );
    });
  });

  it("compiles attribute directives", () => {
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          setCacheData(element, "hasCompiled", true);
        },
      };
    });

    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el);
    expect(getCacheData(el, "hasCompiled")).toBe(true);
  });

  it("compiles attribute directives with prefixes", () => {
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          setCacheData(element, "hasCompiled", true);
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el);
    expect(getCacheData(el, "hasCompiled")).toBe(true);
  });

  it("compiles several attribute directives in an element", () => {
    myModule
      .directive("myDirective", () => {
        return {
          compile: function (element) {
            setCacheData(element, "hasCompiled", true);
          },
        };
      })
      .directive("mySecondDirective", () => {
        return {
          compile: function (element) {
            setCacheData(element, "secondCompiled", true);
          },
        };
      });
    reloadModules();
    const el = $("<div my-directive my-second-directive></div>");
    $compile(el);
    expect(getCacheData(el, "hasCompiled")).toBe(true);
    expect(getCacheData(el, "secondCompiled")).toBe(true);
  });

  it("compiles both element and attributes directives in an element", () => {
    myModule
      .directive("myDirective", () => {
        return {
          compile: function (element) {
            setCacheData(element, "hasCompiled", true);
          },
        };
      })
      .directive("mySecondDirective", () => {
        return {
          compile: function (element) {
            setCacheData(element, "secondCompiled", true);
          },
        };
      });

    reloadModules();
    const el = $("<my-directive my-second-directive></my-directive>");
    $compile(el);
    expect(getCacheData(el, "hasCompiled")).toBe(true);
    expect(getCacheData(el, "secondCompiled")).toBe(true);
  });

  it("compiles attribute directives with ng-attr prefix", () => {
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          setCacheData(element, "hasCompiled", true);
        },
      };
    });
    reloadModules();
    const el = $("<div ng-attr-my-directive></div>");
    $compile(el);
    expect(getCacheData(el, "hasCompiled")).toBe(true);
  });

  it("compiles attribute directives with ng-attr prefix", () => {
    myModule.directive("myDirective", () => {
      return {
        compile: function (element) {
          setCacheData(element, "hasCompiled", true);
        },
      };
    });
    reloadModules();
    const el = $("<div ng-attr-my-directive></div>");
    $compile(el);
    expect(getCacheData(el, "hasCompiled")).toBe(true);
  });

  Object.entries({
    E: { element: true, attribute: false },
    A: { element: false, attribute: true },
    EA: { element: true, attribute: true },
  }).forEach(([restrict, expected]) => {
    describe("restricted to " + restrict, () => {
      Object.entries({
        element: "<my-directive></my-directive>",
        attribute: "<div my-directive></div>",
      }).forEach(([type, dom]) => {
        it(
          (expected[type] ? "matches" : "does not match") + " on " + type,
          () => {
            let hasCompiled = false;
            myModule.directive("myDirective", () => {
              return {
                restrict: restrict,
                compile: () => {
                  hasCompiled = true;
                },
              };
            });
            reloadModules();
            $compile(dom);
            expect(hasCompiled).toBe(expected[type]);
          },
        );
      });
    });
  });

  it("applies to attributes when no restrict given", () => {
    let hasCompiled = false;
    myModule.directive("myDirective", () => {
      return {
        compile: () => {
          hasCompiled = true;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el);
    expect(hasCompiled).toBe(true);
  });

  it("applies to elements when no restrict given", () => {
    let hasCompiled = false;
    myModule.directive("myDirective", () => {
      return {
        compile: () => {
          hasCompiled = true;
        },
      };
    });
    reloadModules();
    const el = $("<my-directive></my-directive>");
    $compile(el);
    expect(hasCompiled).toBe(true);
  });

  it("does not apply to classes when no restrict given", () => {
    let hasCompiled = false;
    myModule.directive("myDirective", () => {
      return {
        compile: () => {
          hasCompiled = true;
        },
      };
    });
    reloadModules();
    const el = $('<div class="my-directive"></div>');
    $compile(el);
    expect(hasCompiled).toBe(false);
  });

  it("applies in priority order", () => {
    const compilations = [];
    myModule
      .directive("lowerDirective", () => {
        return {
          priority: 1,
          compile: () => {
            compilations.push("lower");
          },
        };
      })
      .directive("higherDirective", () => {
        return {
          priority: 2,
          compile: () => {
            compilations.push("higher");
          },
        };
      });
    reloadModules();
    const el = $("<div lower-directive higher-directive></div>");
    $compile(el);
    expect(compilations).toEqual(["higher", "lower"]);
  });

  it("applies in name order when priorities are the same", () => {
    const compilations = [];
    myModule
      .directive("firstDirective", () => {
        return {
          priority: 1,
          compile: () => {
            compilations.push("first");
          },
        };
      })
      .directive("secondDirective", () => {
        return {
          priority: 1,
          compile: () => {
            compilations.push("second");
          },
        };
      });
    reloadModules();
    $compile("<div second-directive first-directive></div>");
    expect(compilations).toEqual(["first", "second"]);
  });

  it("applies in registration order when names are the same", () => {
    const compilations = [];
    myModule
      .directive("aDirective", () => {
        return {
          priority: 1,
          compile: () => {
            compilations.push("first");
          },
        };
      })
      .directive("aDirective", () => {
        return {
          priority: 1,
          compile: () => {
            compilations.push("second");
          },
        };
      });
    reloadModules();
    $compile("<div a-directive></div>");
    expect(compilations).toEqual(["first", "second"]);
  });

  it("uses default priority when one not given", () => {
    const compilations = [];
    myModule
      .directive("firstDirective", () => {
        return {
          priority: 1,
          compile: () => {
            compilations.push("first");
          },
        };
      })
      .directive("secondDirective", () => {
        return {
          compile: () => {
            compilations.push("second");
          },
        };
      });
    reloadModules();
    $compile("<div second-directive first-directive></div>");
    expect(compilations).toEqual(["first", "second"]);
  });

  it("stops compiling at a terminal directive", () => {
    const compilations = [];

    myModule
      .directive("firstDirective", () => {
        return {
          priority: 1,
          terminal: true,
          compile: () => {
            compilations.push("first");
          },
        };
      })
      .directive("secondDirective", () => {
        return {
          priority: 0,
          compile: () => {
            compilations.push("second");
          },
        };
      });
    reloadModules();
    $compile("<div first-directive second-directive></div>");
    expect(compilations).toEqual(["first"]);
  });

  it("still compiles directives with same priority after terminal", () => {
    const compilations = [];
    myModule
      .directive("firstDirective", () => {
        return {
          priority: 1,
          terminal: true,
          compile: () => {
            compilations.push("first");
          },
        };
      })
      .directive("secondDirective", () => {
        return {
          priority: 1,
          compile: () => {
            compilations.push("second");
          },
        };
      });
    reloadModules();
    $compile("<div first-directive second-directive></div>");
    expect(compilations).toEqual(["first", "second"]);
  });

  it("stops child compilation after a terminal directive", () => {
    const compilations = [];
    myModule
      .directive("parentDirective", () => {
        return {
          terminal: true,
          compile: () => {
            compilations.push("parent");
          },
        };
      })
      .directive("childDirective", () => {
        return {
          compile: () => {
            compilations.push("child");
          },
        };
      });
    reloadModules();
    $compile("<div parent-directive><div child-directive></div></div>");
    expect(compilations).toEqual(["parent"]);
  });

  describe("multiple directives per element", () => {
    beforeEach(() => {
      registerDefaultDirectives();
    });

    afterEach(() => {
      dealoc(element);
    });

    it("should allow multiple directives per element", () => {
      reloadModules();
      const el = $(
        "<span greet='angular' log='L' high-log='H' data-medium-log='M'></span>",
      );
      $compile(el)($rootScope);
      expect(el.innerText).toEqual("Hello angular");
      expect(log.join("; ")).toEqual("L; M; H");
    });

    it("should recurse to children", () => {
      reloadModules();
      element = $compile(
        '<div>0<a set="hello">1</a>2<b set="angular">3</b>4</div>',
      )($rootScope);
      expect(element.innerText).toEqual("0hello2angular4");
    });

    it("should allow directives in SVG element classes", () => {
      reloadModules();
      if (!window.SVGElement) return;
      element = $compile('<svg><text greet="angular" log="123"></text></svg>')(
        $rootScope,
      );
      const text = element.firstChild;
      // In old Safari, SVG elements don't have innerHTML, so element.innerHTML won't work
      // (https://bugs.webkit.org/show_bug.cgi?id=136903)
      expect(text.innerText).toEqual("Hello angular");
      expect(log[0]).toEqual("123");
    });

    it("should ignore not set CSS classes on SVG elements", async () => {
      reloadModules();
      if (!window.SVGElement) return;
      // According to spec SVG element className property is readonly, but only FF
      // implements it this way which causes compile exceptions.
      element = $compile("<svg><text>{{1}}</text></svg>")($rootScope);
      await wait();
      expect(element.textContent).toEqual("1");
    });

    it("should receive scope, element, and attributes", () => {
      let injectableInjector;
      myModule.directive("log", ($rootScope, $injector) => {
        injectableInjector = $injector;
        return {
          restrict: "A",
          compile(element, templateAttr) {
            expect(typeof templateAttr.$normalize).toBe("function");
            expect(typeof templateAttr.$set).toBe("function");
            expect(isElement(templateAttr.$$element)).toBeTruthy();
            expect(element.textContent).toEqual("unlinked");
            expect(templateAttr.exp).toEqual("abc");
            expect(templateAttr.aa).toEqual("A");
            expect(templateAttr.bb).toEqual("B");
            expect(templateAttr.cc).toEqual("C");
            return function (scope, element, attr) {
              expect(element.textContent).toEqual("unlinked");
              expect(attr).toBe(templateAttr);
              expect(scope).toEqual($rootScope);
              element.innerText = "worked";
            };
          },
        };
      });

      reloadModules();
      element = $compile(
        '<div log exp="abc" aa="A" Bb="B" daTa-cC="C">unlinked</div>',
      )($rootScope);

      expect(element.textContent).toEqual("worked");
      expect(injector).toBe(injectableInjector);
      // verify that directive is injectable
    });
  });

  describe("attributes", () => {
    /**
     * 1. Register a directive
     * 2. Compile a DOM fragment
     * 3. Grab the attributes object
     * 4. Run some checks on it.
     *
     * @param {*} dirName A directive name to register
     * @param {*} domString A a DOM string to parse and compile,
     * @param {*} callback A callback to invoke when it’s all done
     */
    function registerAndCompile(dirName, domString, callback) {
      let givenAttrs;
      registerDirectives(dirName, () => {
        return {
          compile: function (element, attrs) {
            givenAttrs = attrs;
          },
        };
      });
      reloadModules();
      const el = $(domString);
      $compile(el);
      callback(el, givenAttrs, $rootScope);
    }

    it("passes the element attributes to the compile function", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive my-attr="1" my-other-attr="two"></my-directive>',
        function (element, attrs) {
          expect(attrs.myAttr).toEqual("1");
          expect(attrs.myOtherAttr).toEqual("two");
        },
      );
    });

    it("trims attribute values", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive my-attr="val"></my-directive>',
        function (element, attrs) {
          expect(attrs.myAttr).toEqual("val");
        },
      );
    });

    it("sets the value of boolean attributes to true", () => {
      registerAndCompile(
        "myDirective",
        "<input my-directive disabled>",
        function (element, attrs) {
          expect(attrs.disabled).toBe(true);
        },
      );
    });

    it("does not set the value of non-standard boolean attributes to true", () => {
      registerAndCompile(
        "myDirective",
        "<input my-directive whatever>",
        function (element, attrs) {
          expect(attrs.whatever).toEqual("");
        },
      );
    });

    it("overrides attributes with ng-attr- versions", () => {
      registerAndCompile(
        "myDirective",
        '<input my-directive ng-attr-whatever="42" whatever="41">',
        function (element, attrs) {
          expect(attrs.whatever).toEqual("42");
        },
      );
    });

    it("allows setting attributes", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive attr="true"></my-directive>',
        function (element, attrs) {
          attrs.$set("attr", "false");
          expect(attrs.attr).toEqual("false");
          expect(element.getAttribute("attr")).toEqual("false");
        },
      );
    });

    it("sets attributes to DOM", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive attr="true"></my-directive>',
        function (element, attrs) {
          attrs.$set("attr", "false");
          expect(attrs.attr).toEqual("false");
        },
      );
    });

    it("does not set attributes to DOM when flag set to false", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive attr="true"></my-directive>',
        function (element, attrs) {
          attrs.$set("attr", "false", false);
          expect(element.getAttribute("attr")).toEqual("true");
          expect(attrs.attr).toEqual("false");
        },
      );
    });

    it("shares attributes between directives", () => {
      let attrs1, attrs2;
      registerDirectives({
        myDir: () => {
          return {
            compile: function (element, attrs) {
              attrs1 = attrs;
            },
          };
        },
        myOtherDir: () => {
          return {
            compile: function (element, attrs) {
              attrs2 = attrs;
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-dir my-other-dir></div>");
      $compile(el);
      expect(attrs1).toBe(attrs2);
    });

    it("sets prop for boolean attributes", () => {
      registerAndCompile(
        "myDirective",
        "<input my-directive>",
        function (element, attrs) {
          attrs.$set("disabled", true);
          expect(element["disabled"]).toBe(true);
        },
      );
    });

    it("sets prop for boolean attributes even when not flushing", () => {
      registerAndCompile(
        "myDirective",
        "<input my-directive>",
        function (element, attrs) {
          attrs.$set("disabled", true, false);
          expect(element["disabled"]).toBe(true);
        },
      );
    });

    it("denormalizes attribute name when explicitly given", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs) {
          attrs.$set("someAttribute", 43, true, "some-attribute");
          expect(element.getAttribute("some-attribute")).toEqual("43");
        },
      );
    });

    it("denormalizes attribute by snake-casing when no other means available", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs) {
          attrs.$set("someAttribute", 43);
          expect(element.getAttribute("some-attribute")).toEqual("43");
        },
      );
    });

    it("denormalizes attribute by using original attribute name", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs) {
          attrs.$set("someAttribute", 43);
          expect(element.getAttribute("some-attribute")).toEqual("43");
        },
      );
    });

    it("accepts attribute by using original attribute name", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs) {
          attrs.$set("some-attribute", 43);
          expect(element.getAttribute("some-attribute")).toEqual("43");
        },
      );
    });

    it("does not use ng-attr- prefix in denormalized names", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive ng-attr-some-attribute="42"></my-directive>',
        function (element, attrs) {
          attrs.$set("someAttribute", 43);
          expect(element.getAttribute("some-attribute")).toEqual("43");
        },
      );
    });

    it("uses new attribute name after once given", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs) {
          attrs.$set("someAttribute", 43, true, "some-attribute");
          attrs.$set("someAttribute", 44);

          expect(element.getAttribute("some-attribute")).toEqual("44");
        },
      );
    });

    it("calls observer immediately when attribute is $set", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs) {
          let gotValue;
          attrs.$observe("someAttribute", function (value) {
            gotValue = value;
          });

          attrs.$set("someAttribute", "43");
          expect(gotValue).toEqual("43");
        },
      );
    });

    it("calls observer on immediately after registration", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs, $rootScope) {
          let gotValue;
          attrs.$observe("someAttribute", function (value) {
            gotValue = value;
          });
          expect(gotValue).toEqual("42");
        },
      );
    });

    it("lets observers be deregistered", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive some-attribute="42"></my-directive>',
        function (element, attrs) {
          let gotValue;
          const remove = attrs.$observe("someAttribute", function (value) {
            gotValue = value;
          });

          attrs.$set("someAttribute", "43");
          expect(gotValue).toEqual("43");

          remove();
          attrs.$set("someAttribute", "44");
          expect(gotValue).toEqual("43");
        },
      );
    });

    it("does not add attribute from class without a directive", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive class="some-class"></my-directive>',
        function (element, attrs) {
          expect(attrs.hasOwnProperty("someClass")).toBe(false);
        },
      );
    });

    it("allows adding classes", () => {
      registerAndCompile(
        "myDirective",
        "<my-directive></my-directive>",
        function (element, attrs) {
          attrs.$addClass("some-class");
          expect(element.classList.contains("some-class")).toBe(true);
        },
      );
    });

    it("allows removing classes", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive class="some-class"></my-directive>',
        function (element, attrs) {
          attrs.$removeClass("some-class");
          expect(element.classList.contains("some-class")).toBe(false);
        },
      );
    });

    it("allows updating classes", () => {
      registerAndCompile(
        "myDirective",
        '<my-directive class="one three four"></my-directive>',
        function (element, attrs) {
          attrs.$updateClass("one two three", "one three four");
          expect(element.classList.contains("one")).toBe(true);
          expect(element.classList.contains("two")).toBe(true);
          expect(element.classList.contains("three")).toBe(true);
          expect(element.classList.contains("four")).toBe(false);
        },
      );
    });
  });

  it("returns a public link function from compile", () => {
    registerDirectives("myDirective", () => {
      return { compile: () => {} };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    const linkFn = $compile(el);
    expect(linkFn).toBeDefined();
    expect(isFunction(linkFn)).toBe(true);
  });

  describe("linking", () => {
    it("takes a scope and attaches it to elements", async () => {
      registerDirectives("myDirective", () => {
        return { compile: () => {} };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      await wait();
      expect(getCacheData(el, "$scope")).toBe($rootScope);
      expect(getScope(el)).toBe($rootScope);
    });

    it("calls directive link function with scope", async () => {
      let givenScope, givenElement, givenAttrs;
      registerDirectives("myDirective", () => {
        return {
          compile: () => {
            return function link(scope, element, attrs) {
              givenScope = scope;
              givenElement = element;
              givenAttrs = attrs;
            };
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      await wait();
      expect(givenScope).toBe($rootScope);
      expect(givenElement).toBe(el);
      expect(givenAttrs).toBeDefined();
      expect(givenAttrs.myDirective).toBeDefined();
    });

    it("supports link function in directive definition object", () => {
      let givenScope, givenElement, givenAttrs;
      registerDirectives("myDirective", () => {
        return {
          link: function (scope, element, attrs) {
            givenScope = scope;
            givenElement = element;
            givenAttrs = attrs;
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      expect(givenScope).toBe($rootScope);
      expect(givenElement).toBe(el);
      expect(givenAttrs).toBeDefined();
      expect(givenAttrs.myDirective).toBeDefined();
    });

    it("links directive on child elements first", function () {
      const givenElements = [];
      registerDirectives("myDirective", function () {
        return {
          link: function (scope, element, attrs) {
            givenElements.push(element);
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive><div my-directive></div></div>");
      $compile(el)($rootScope);

      expect(givenElements.length).toBe(2);
      expect(givenElements[0]).toBe(el.firstChild);
      expect(givenElements[1]).toBe(el);
    });

    it("links directive on multiple child elements first", function () {
      const givenElements = [];
      registerDirectives("myDirective", function () {
        return {
          link: function (scope, element, attrs) {
            givenElements.push(element);
          },
        };
      });
      reloadModules();
      const el = $(
        "<div my-directive><div my-directive></div><div my-directive></div></div>",
      );
      $compile(el)($rootScope);

      expect(givenElements.length).toBe(3);
      expect(givenElements[0]).toBe(el.children[0]);
      expect(givenElements[1]).toBe(el.children[1]);
      expect(givenElements[2]).toBe(el);
    });
  });

  it("links children when parent has no directives", async () => {
    const givenElements = [];
    registerDirectives("myDirective", () => {
      return {
        link: function (scope, element, attrs) {
          givenElements.push(element);
        },
      };
    });
    reloadModules();
    const el = $("<div><div my-directive></div></div>");
    $compile(el)($rootScope);
    await wait();
    expect(givenElements.length).toBe(1);
    expect(givenElements[0]).toBe(el.firstChild);
  });

  it("links nested children when parent has no directives", async () => {
    const givenElements = [];
    registerDirectives("myDirective", () => {
      return {
        link: function (scope, element, attrs) {
          givenElements.push(element);
        },
      };
    });
    reloadModules();
    const el = $(
      `<div><div my-directive><div><div my-directive></div></div></div></div>`,
    );
    $compile(el)($rootScope);
    await wait();
    expect(givenElements.length).toBe(2);
    // children are linked first in reverse order for post elements - which is the default behaviour
    expect(givenElements[0]).toBe(el.firstChild.firstChild.firstChild);
    expect(givenElements[1]).toBe(el.firstChild);
  });

  it("supports link function objects", () => {
    let linked;
    registerDirectives("myDirective", () => {
      return {
        link: {
          post: function (scope, element, attrs) {
            linked = true;
          },
        },
      };
    });
    reloadModules();
    const el = $("<div><div my-directive></div></div>");
    $compile(el)($rootScope);
    expect(linked).toBe(true);
  });

  it("supports prelinking and postlinking", () => {
    const linkings = [];
    registerDirectives("myDirective", () => {
      return {
        link: {
          pre: function (scope, element) {
            linkings.push(["pre", element]);
          },
          post: function (scope, element) {
            linkings.push(["post", element]);
          },
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive><div my-directive></div></div>");
    $compile(el)($rootScope);
    expect(linkings.length).toBe(4);
    // The order of the link function invocations is:
    // 1. Parent prelink
    // 2. Child prelink
    // 3. Child postlink
    // 4. Parent postlink
    expect(linkings[0]).toEqual(["pre", el]);
    expect(linkings[1]).toEqual(["pre", el.firstChild]);
    expect(linkings[2]).toEqual(["post", el.firstChild]);
    expect(linkings[3]).toEqual(["post", el]);
  });

  it("reverses priority for postlink functions", () => {
    const linkings = [];
    registerDirectives({
      firstDirective: () => {
        return {
          priority: 2,
          link: {
            pre: function (scope, element) {
              linkings.push("first-pre");
            },
            post: function (scope, element) {
              linkings.push("first-post");
            },
          },
        };
      },
      secondDirective: () => {
        return {
          priority: 1,
          link: {
            pre: function (scope, element) {
              linkings.push("second-pre");
            },
            post: function (scope, element) {
              linkings.push("second-post");
            },
          },
        };
      },
    });
    reloadModules();
    const el = $("<div first-directive second-directive></div>");
    $compile(el)($rootScope);
    expect(linkings).toEqual([
      "first-pre",
      "second-pre",
      "second-post",
      "first-post",
    ]);
  });

  it("stabilizes node list during linking", () => {
    const givenElements = [];
    registerDirectives("myDirective", () => {
      return {
        link: function (scope, element, attrs) {
          givenElements.push(element);
          element.after($("<div></div>"));
        },
      };
    });
    reloadModules();
    const el = $("<div><div my-directive></div><div my-directive></div></div>");
    const el1 = el.childNodes[0],
      el2 = el.childNodes[1];
    $compile(el)($rootScope);
    expect(givenElements.length).toBe(2);
    expect(givenElements[0]).toBe(el1);
    expect(givenElements[1]).toBe(el2);
  });

  it("makes new scope for element when directive asks for it", () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: true,
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    expect(givenScope.$parent.id).toBe($rootScope.id);
  });

  it("makes new scope for element when directive rejects it", () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: false,
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    //A false value for scope is considered equivalent to undefined, i.e. should receive parent scope
    expect(givenScope.id).toBe($rootScope.id);
  });

  it("gives inherited scope to all directives on element", () => {
    let givenScope;
    registerDirectives({
      myDirective: () => {
        return {
          scope: true,
        };
      },
      myOtherDirective: () => {
        return {
          link: function (scope) {
            givenScope = scope;
          },
        };
      },
    });
    reloadModules();
    const el = $("<div my-directive my-other-directive></div>");
    $compile(el)($rootScope);
    expect(givenScope.$parent.$id).toBe($rootScope.$id);
  });

  it("adds new scope data for element with new scope", function () {
    let givenScope;
    registerDirectives("myDirective", function () {
      return {
        scope: true,
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    expect(getScope(el)).toBe(givenScope);
  });

  it("adds new scope", async () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: true,
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    await wait();
    expect($rootScope.$children[0].$id).toBe(givenScope.$id);
  });

  it("creates an isolate scope when requested", () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: {},
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    expect(givenScope.$parent.$id).toBe($rootScope.$id);
    expect($rootScope.$children[0]).toBe(givenScope);
    expect(Object.getPrototypeOf(givenScope)).not.toBe($rootScope);
  });

  it("does not share isolate scope with other directives on the element", () => {
    let givenScope;
    registerDirectives({
      myDirective: () => {
        return {
          scope: {},
        };
      },
      myOtherDirective: () => {
        return {
          link: function (scope) {
            givenScope = scope;
          },
        };
      },
    });
    reloadModules();
    const el = $("<div my-directive my-other-directive></div>");
    $compile(el)($rootScope);
    expect(givenScope).toBeDefined();
    expect(givenScope).toBe($rootScope);
  });

  it("does not use isolate scope on child elements", () => {
    let givenScope;
    registerDirectives({
      myDirective: () => {
        return {
          scope: {},
        };
      },
      myOtherDirective: () => {
        return {
          link: function (scope) {
            givenScope = scope;
          },
        };
      },
    });
    reloadModules();
    const el = $("<div my-directive><div my-other-directive></div></div>");
    $compile(el)($rootScope);
    expect(givenScope).toBeDefined();
    expect(givenScope).toBe($rootScope);
  });

  it("does not allow two isolate scope directives on an element", () => {
    registerDirectives({
      myDirective: () => {
        return {
          scope: {},
        };
      },
      myOtherDirective: () => {
        return {
          scope: {},
        };
      },
    });
    reloadModules();
    const el = $("<div my-directive my-other-directive></div>");
    expect(() => {
      $compile(el);
    }).toThrowError();
  });

  it("does not allow both isolate and inherited scopes on an element", () => {
    registerDirectives({
      myDirective: () => {
        return {
          scope: {},
        };
      },
      myOtherDirective: () => {
        return {
          scope: true,
        };
      },
    });
    reloadModules();
    const el = $("<div my-directive my-other-directive></div>");
    expect(() => {
      $compile(el);
    }).toThrowError();
  });

  it("adds data for element with isolated scope", function () {
    let givenScope;
    registerDirectives("myDirective", function () {
      return {
        scope: {},
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    expect(getIsolateScope(el)).toBe(givenScope);
  });

  it("allows observing attribute to the isolate scope", () => {
    let givenScope, givenAttrs;
    registerDirectives("myDirective", () => {
      return {
        scope: {
          anAttr: "@",
        },
        link: function (scope, element, attrs) {
          givenScope = scope;
          givenAttrs = attrs;
        },
      };
    });
    reloadModules();
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    givenAttrs.$set("anAttr", "42");
    expect(givenScope.anAttr).toEqual("42");

    givenAttrs.$set("anAttr", "43");
    expect(givenScope.anAttr).toEqual("43");
  });

  it("sets initial value of observed attr to the isolate scope", () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: {
          anAttr: "@",
        },
        link: function (scope, element, attrs) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $('<div my-directive an-attr="42"></div>');
    $compile(el)($rootScope);
    expect(givenScope.anAttr).toEqual("42");
  });

  it("allows aliasing observed attribute", async () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: {
          aScopeAttr: "@anAttr",
        },
        link: function (scope, element, attrs) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    const el = $('<div my-directive an-attr="42"></div>');
    $compile(el)($rootScope);
    await wait();
    expect(givenScope.aScopeAttr).toEqual("42");
  });

  describe("bi-directional databinding", () => {
    it("allows binding expression to isolate scope", () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            anAttr: "=",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      const el = $('<div my-directive an-attr="42"></div>');
      $compile(el)($rootScope);
      expect(givenScope.anAttr).toBe(42);
    });

    it("allows aliasing expression attribute on isolate scope", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=theAttr",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      const el = $('<div my-directive the-attr="42"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(givenScope.myAttr).toBe(42);
    });

    it("evaluates isolate scope expression on parent scope", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      $rootScope.parentAttr = 41;
      const el = $('<div my-directive my-attr="parentAttr + 1"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(givenScope.myAttr).toBe(42);
    });

    it("watches isolated scope expressions", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();

      const el = $('<div my-directive my-attr="parentAttr + 1"></div>');
      $compile(el)($rootScope);
      await wait();
      $rootScope.parentAttr = 41;
      await wait();
      expect(givenScope.myAttr).toBe(42);
    });

    it("does not watch optional missing two-way expressions", async () => {
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=?",
          },
          link: () => {},
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      await wait();
      expect($rootScope.$handler.watchers.size).toEqual(1);
    });

    it("allows assigning to two-way scope expressions", async () => {
      let isolateScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=",
          },
          link: function (scope) {
            isolateScope = scope;
          },
        };
      });
      reloadModules();
      const el = $('<div my-directive my-attr="parentAttr"></div>');
      $compile(el)($rootScope);
      await wait();
      isolateScope.myAttr = 42;

      await wait();
      expect($rootScope.parentAttr).toBe(42);
    });

    it("gives parent change precedence when both parent and child change", async () => {
      let isolateScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=",
          },
          link: function (scope) {
            isolateScope = scope;
          },
        };
      });
      reloadModules();
      const el = $('<div my-directive my-attr="parentAttr"></div>');
      $compile(el)($rootScope);
      $rootScope.parentAttr = 42;
      isolateScope.myAttr = 43;
      await wait();
      expect($rootScope.parentAttr).toBe(42);
      expect(isolateScope.myAttr).toBe(42);
    });

    it("does not throw when two-way expression returns new arrays", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      $rootScope.parentFunction = () => {
        return [1, 2, 3];
      };
      const el = $('<div my-directive my-attr="parentFunction()"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(givenScope.myAttr).toEqual([1, 2, 3]);
    });

    it("can watch two-way bindings as collections", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "=",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      $rootScope.parentFunction = () => {
        return [1, 2, 3];
      };
      const el = $('<div my-directive my-attr="parentFunction()"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(givenScope.myAttr.$target).toEqual([1, 2, 3]);
    });
  });

  describe("one-way databinding", () => {
    it("allows binding expression to isolate scope", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            anAttr: "<",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      const el = $('<div my-directive an-attr="42"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(givenScope.anAttr).toBe(42);
    });

    it("allows aliasing expression attribute on isolate scope", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "<theAttr",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      const el = $('<div my-directive the-attr="42"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(givenScope.myAttr).toBe(42);
    });

    it("evaluates isolate scope expression on parent scope", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "<",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      $rootScope.parentAttr = 41;
      const el = $('<div my-directive my-attr="parentAttr + 1"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(givenScope.myAttr).toBe(42);
    });

    it("watches isolated scope expressions", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "<",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();

      const el = $('<div my-directive my-attr="parentAttr + 1"></div>');
      $compile(el)($rootScope);
      await wait();
      $rootScope.parentAttr = 41;
      await wait();
      expect(givenScope.myAttr).toBe(42);
    });

    it("does not watch optional missing isolate scope expressions", async () => {
      let givenScope;
      registerDirectives("myDirective", () => {
        return {
          scope: {
            myAttr: "<?",
          },
          link: function (scope) {
            givenScope = scope;
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      await wait();
      expect($rootScope.$handler.watchers.size).toEqual(1);
    });
  });

  it("allows binding an invokable expression on the parent scope", () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: {
          myExpr: "&",
        },
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    $rootScope.parentFunction = () => {
      return 42;
    };
    const el = $('<div my-directive my-expr="parentFunction() + 1"></div>');
    $compile(el)($rootScope);
    expect(givenScope.myExpr()).toBe(43);
  });

  it("allows passing arguments to parent scope expression", () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: {
          myExpr: "&",
        },
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    let gotArg;
    $rootScope.parentFunction = function (arg) {
      gotArg = arg;
    };
    const el = $(
      '<div my-directive my-expr="parentFunction(argFromChild)"></div>',
    );
    $compile(el)($rootScope);
    givenScope.myExpr({ argFromChild: 42 });
    expect(gotArg).toBe(42);
  });

  it("sets missing optional parent scope expression to undefined", () => {
    let givenScope;
    registerDirectives("myDirective", () => {
      return {
        scope: {
          myExpr: "&?",
        },
        link: function (scope) {
          givenScope = scope;
        },
      };
    });
    reloadModules();
    let gotArg;
    $rootScope.parentFunction = function (arg) {
      gotArg = arg;
    };
    const el = $("<div my-directive></div>");
    $compile(el)($rootScope);
    expect(givenScope.myExpr).toBeUndefined();
  });

  describe("controllers", () => {
    it("can be attached to directives as functions", async () => {
      let controllerInvoked;
      registerDirectives("myDirective", () => {
        return {
          controller: function MyController() {
            controllerInvoked = true;
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      await wait();
      expect(controllerInvoked).toBe(true);
    });

    it("can be attached to directives as string references", async () => {
      let controllerInvoked;

      function MyController() {
        controllerInvoked = true;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return { controller: "MyController" };
        });

      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      await wait();
      expect(controllerInvoked).toBe(true);
    });

    it("can be applied in the same element independent of each other", () => {
      let controllerInvoked;
      let otherControllerInvoked;

      function MyController() {
        controllerInvoked = true;
      }
      function MyOtherController() {
        otherControllerInvoked = true;
      }
      myModule
        .controller("MyController", MyController)
        .controller("MyOtherController", MyOtherController)
        .directive("myDirective", () => {
          return { controller: "MyController" };
        })
        .directive("myOtherDirective", () => {
          return { controller: "MyOtherController" };
        });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      $compile(el)($rootScope);
      expect(controllerInvoked).toBe(true);
      expect(otherControllerInvoked).toBe(true);
    });

    it("can be applied to different directives, as different instances", () => {
      let invocations = 0;

      function MyController() {
        invocations++;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return { controller: "MyController" };
        })
        .directive("myOtherDirective", () => {
          return { controller: "MyController" };
        });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      $compile(el)($rootScope);
      expect(invocations).toBe(2);
    });

    it("can be aliased with @ when given in directive attribute", () => {
      let controllerInvoked;

      function MyController() {
        controllerInvoked = true;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return { controller: "@" };
        });
      reloadModules();

      $compile('<div my-directive="MyController"></div>')($rootScope);
      expect(controllerInvoked).toBe(true);
    });

    it("gets scope, element, and attrs through DI", () => {
      let gotScope, gotElement, gotAttrs;

      function MyController($element, $scope, $attrs) {
        gotElement = $element;
        gotScope = $scope;
        gotAttrs = $attrs;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return { controller: "MyController" };
        });
      reloadModules();
      const el = $('<div my-directive an-attr="abc"></div>');
      $compile(el)($rootScope);
      expect(gotElement[0]).toBe(el[0]);
      expect(gotScope).toBe($rootScope);
      expect(gotAttrs).toBeDefined();
      expect(gotAttrs.anAttr).toEqual("abc");
    });

    it("can be attached on the scope", () => {
      function MyController() {}
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return {
            controller: "MyController",
            controllerAs: "myCtrl",
          };
        });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      expect($rootScope.myCtrl).toBeDefined();
      expect($rootScope.myCtrl instanceof MyController).toBe(true);
    });

    it("gets isolate scope as injected $scope", () => {
      let gotScope;

      function MyController($scope) {
        gotScope = $scope;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: "MyController",
          };
        });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      expect(gotScope).not.toBe($rootScope);
    });

    it("has isolate scope bindings available during construction", () => {
      let gotMyAttr;

      function MyController($scope) {
        gotMyAttr = $scope.myAttr;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return {
            scope: {
              myAttr: "@myDirective",
            },
            controller: "MyController",
          };
        });
      reloadModules();
      const el = $('<div my-directive="abc"></div>');
      $compile(el)($rootScope);
      expect(gotMyAttr).toEqual("abc");
    });

    it("can bind isolate scope bindings directly to self", () => {
      let ctl;

      function MyController() {
        ctl = this;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return {
            scope: {
              myAttr: "@myDirective",
            },
            controller: "MyController",
            bindToController: true,
          };
        });
      reloadModules();
      const el = $('<div my-directive="abc"></div>');

      $compile(el)($rootScope);
      expect(ctl.myAttr).toEqual("abc");
    });

    it("can return a semi-constructed controller when using array injection", () => {
      myModule.constant("aDep", 42);
      reloadModules();
      const $controller = injector.get("$controller");

      function MyController(aDep) {
        this.aDep = aDep;
        this.constructed = true;
      }

      const controller = $controller(["aDep", MyController], null, true);
      expect(controller.constructed).toBeUndefined();
      const actualController = controller();
      expect(actualController.constructed).toBeDefined();
      expect(actualController.aDep).toBe(42);
    });

    it("can bind iso scope bindings through bindToController", () => {
      let ctl;

      function MyController() {
        ctl = this;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: "MyController",
            bindToController: {
              myAttr: "@myDirective",
            },
          };
        });
      reloadModules();
      const el = $('<div my-directive="abc"></div>');
      $compile(el)($rootScope);
      expect(ctl.myAttr).toEqual("abc");
    });

    it("can bind through bindToController without iso scope", () => {
      let ctl;

      function MyController() {
        ctl = this;
      }
      myModule
        .controller("MyController", MyController)
        .directive("myDirective", () => {
          return {
            scope: true,
            controller: "MyController",
            bindToController: {
              myAttr: "@myDirective",
            },
          };
        });
      reloadModules();
      const el = $('<div my-directive="abc"></div>');
      $compile(el)($rootScope);
      expect(ctl.myAttr).toEqual("abc");
    });

    it("can be required from a sibling directive", () => {
      function MyController() {}

      let gotMyController;
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: "myDirective",
            link: function (scope, element, attrs, myController) {
              gotMyController = myController;
            },
          };
        });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      $compile(el)($rootScope);
      expect(gotMyController).toBeDefined();
      expect(gotMyController instanceof MyController).toBe(true);
    });

    it("can be required from multiple sibling directives", () => {
      function MyController() {}
      function MyOtherController() {}

      let gotControllers;
      myModule
        .directive("myDirective", () => {
          return {
            scope: true,
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            scope: true,
            controller: MyOtherController,
          };
        })
        .directive("myThirdDirective", () => {
          return {
            require: ["myDirective", "myOtherDirective"],
            link: function (scope, element, attrs, controllers) {
              gotControllers = controllers;
            },
          };
        });
      reloadModules();
      const el = $(
        "<div my-directive my-other-directive my-third-directive></div>",
      );
      $compile(el)($rootScope);
      expect(gotControllers).toBeDefined();
      expect(gotControllers.length).toBe(2);
      expect(gotControllers[0] instanceof MyController).toBe(true);
      expect(gotControllers[1] instanceof MyOtherController).toBe(true);
    });

    it("can be required as an object", () => {
      function MyController() {}
      function MyOtherController() {}

      let gotControllers;
      myModule
        .directive("myDirective", () => {
          return {
            scope: true,
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            scope: true,
            controller: MyOtherController,
          };
        })
        .directive("myThirdDirective", () => {
          return {
            require: {
              myDirective: "myDirective",
              myOtherDirective: "myOtherDirective",
            },
            link: function (scope, element, attrs, controllers) {
              gotControllers = controllers;
            },
          };
        });
      reloadModules();
      const el = $(
        "<div my-directive my-other-directive my-third-directive></div>",
      );
      $compile(el)($rootScope);
      expect(gotControllers).toBeDefined();
      expect(gotControllers.myDirective instanceof MyController).toBe(true);
      expect(gotControllers.myOtherDirective instanceof MyOtherController).toBe(
        true,
      );
    });

    it("can be required as an object with values omitted", () => {
      function MyController() {}

      let gotControllers;
      myModule
        .directive("myDirective", () => {
          return {
            scope: true,
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: {
              myDirective: "",
            },
            link: function (scope, element, attrs, controllers) {
              gotControllers = controllers;
            },
          };
        });
      reloadModules();
      const el = $(
        "<div my-directive my-other-directive my-third-directive></div>",
      );
      $compile(el)($rootScope);
      expect(gotControllers).toBeDefined();
      expect(gotControllers.myDirective instanceof MyController).toBe(true);
    });

    it("requires itself if there is no explicit require", () => {
      function MyController() {}

      let gotMyController;
      myModule.directive("myDirective", () => {
        return {
          scope: {},
          controller: MyController,
          link: function (scope, element, attrs, myController) {
            gotMyController = myController;
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      expect(gotMyController).toBeDefined();
      expect(gotMyController instanceof MyController).toBe(true);
    });

    it("can be required from a parent directive", async () => {
      function MyController() {}

      let gotMyController;
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: "^myDirective",
            link: function (scope, element, attrs, myController) {
              gotMyController = myController;
            },
          };
        });
      reloadModules();
      const el = $("<div my-directive><div my-other-directive></div></div>");
      $compile(el)($rootScope);
      await wait();
      expect(gotMyController).toBeDefined();
      expect(gotMyController instanceof MyController).toBe(true);
    });

    it("also finds from sibling directive when requiring with parent prefix", () => {
      function MyController() {}

      let gotMyController;
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: "^myDirective",
            link: function (scope, element, attrs, myController) {
              gotMyController = myController;
            },
          };
        });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      $compile(el)($rootScope);
      expect(gotMyController).toBeDefined();
      expect(gotMyController instanceof MyController).toBe(true);
    });

    it("can be required from a parent directive with ^^", () => {
      function MyController() {}

      let gotMyController;
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: "^^myDirective",
            link: function (scope, element, attrs, myController) {
              gotMyController = myController;
            },
          };
        });
      reloadModules();
      const el = $("<div my-directive><div my-other-directive></div></div>");
      $compile(el)($rootScope);
      expect(gotMyController).toBeDefined();
      expect(gotMyController instanceof MyController).toBe(true);
    });

    it("does not find from sibling directive when requiring with ^^", () => {
      function MyController() {}
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: "^^myDirective",
            link: function (scope, element, attrs, myController) {},
          };
        });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      expect(() => {
        $compile(el)($rootScope);
      }).toThrowError();
    });

    it("can be required from parent in object form", () => {
      function MyController() {}

      let gotControllers;
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: {
              myDirective: "^",
            },
            link: function (scope, element, attrs, controllers) {
              gotControllers = controllers;
            },
          };
        });
      reloadModules();
      const el = $("<div my-directive><div my-other-directive></div></div>");
      $compile(el)($rootScope);
      expect(gotControllers.myDirective instanceof MyController).toBe(true);
    });

    it("does not throw on required missing controller when optional", () => {
      let gotCtrl;
      myModule.directive("myDirective", () => {
        return {
          require: "?noSuchDirective",
          link: function (scope, element, attrs, ctrl) {
            gotCtrl = ctrl;
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      expect(gotCtrl).toBe(null);
    });

    it("allows optional marker after parent marker", () => {
      let gotCtrl;
      myModule.directive("myDirective", () => {
        return {
          require: "^?noSuchDirective",
          link: function (scope, element, attrs, ctrl) {
            gotCtrl = ctrl;
          },
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el)($rootScope);
      expect(gotCtrl).toBe(null);
    });

    it("allows optional marker before parent marker", () => {
      function MyController() {}

      let gotMyController;
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: "?^myDirective",
            link: function (scope, element, attrs, ctrl) {
              gotMyController = ctrl;
            },
          };
        });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      $compile(el)($rootScope);
      expect(gotMyController).toBeDefined();
      expect(gotMyController instanceof MyController).toBe(true);
    });

    it("attaches required controllers on controller when using object", () => {
      function MyController() {}

      let ctl;
      myModule
        .directive("myDirective", () => {
          return {
            scope: {},
            controller: MyController,
          };
        })
        .directive("myOtherDirective", () => {
          return {
            require: {
              myDirective: "^",
            },
            bindToController: true,
            controller: function () {
              ctl = this;
            },
          };
        });
      reloadModules();

      $compile("<div my-directive><div my-other-directive></div></div>")(
        $rootScope,
      );
      expect(ctl.myDirective instanceof MyController).toBeTrue();
    });
  });

  describe("template", () => {
    it("populates an element during compilation", () => {
      registerDirectives("myDirective", () => {
        return {
          template: '<div class="from-template"></div>',
        };
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el);
      expect(el.innerHTML).toBe('<div class="from-template"></div>');
    });

    it("replaces any existing children", () => {
      registerDirectives("myDirective", () => {
        return {
          template: '<div class="from-template"></div>',
        };
      });
      reloadModules();
      const el = $('<div my-directive><div class="existing"></div></div>');
      $compile(el);
      expect(el.innerHTML).toBe('<div class="from-template"></div>');
    });

    it("compiles template contents also", () => {
      const compileSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            template: "<div my-other-directive></div>",
          };
        },
        myOtherDirective: () => {
          return {
            compile: compileSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el);
      expect(compileSpy).toHaveBeenCalled();
    });

    it("does not allow two directives with templates", () => {
      registerDirectives({
        myDirective: () => {
          return { template: "<div></div>" };
        },
        myOtherDirective: () => {
          return { template: "<div></div>" };
        },
      });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      expect(() => {
        $compile(el);
      }).toThrowError();
    });

    it("supports functions as template values", () => {
      const templateSpy = jasmine
        .createSpy()
        .and.returnValue('<div class="from-template"></div>');
      registerDirectives({
        myDirective: () => {
          return {
            template: templateSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el);
      expect(el.innerHTML).toBe('<div class="from-template"></div>');
      expect(templateSpy.calls.first().args[0][0]).toBe(el[0]);
      expect(templateSpy.calls.first().args[1].myDirective).toBeDefined();
    });

    it("uses isolate scope for template contents", async () => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            scope: {
              isoValue: "=myDirective",
            },
            template: "<div my-other-directive></div>",
          };
        },
        myOtherDirective: () => {
          return { link: linkSpy };
        },
      });
      reloadModules();
      const el = $('<div my-directive="42"></div>');
      $compile(el)($rootScope);
      await wait();
      expect(linkSpy.calls.first().args[0]).not.toBe($rootScope);
      expect(linkSpy.calls.first().args[0].isoValue).toBe(42);
    });
  });

  describe("templateUrl", () => {
    it("defers remaining directive compilation", async () => {
      const otherCompileSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return { templateUrl: "/my_directive.html" };
        },
        myOtherDirective: () => {
          return { compile: otherCompileSpy };
        },
      });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      $compile(el);
      await wait();
      expect(otherCompileSpy).not.toHaveBeenCalled();
    });

    it("defers current directive compilation", async () => {
      const compileSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            templateUrl: "/public/my_directive.html",
            compile: compileSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el);
      await wait();
      expect(compileSpy).not.toHaveBeenCalled();
    });

    it("immediately empties out the element", async () => {
      registerDirectives({
        myDirective: () => {
          return { templateUrl: "/my_directive.html" };
        },
      });
      reloadModules();
      const el = $("<div my-directive>Hello</div>");
      $compile(el);
      await wait();
      expect(el.innerHTML).toBe("");
    });

    it("populates element with template", (done) => {
      registerDirectives({
        myDirective: () => {
          return { templateUrl: "/public/my_directive.html" };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      $compile(el);
      setTimeout(() => {
        expect(el.children.length).toBe(1);
        done();
      }, 100);
    });

    it("resumes current directive compilation after template received", (done) => {
      const compileSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            templateUrl: "/public/my_directive.html",
            compile: compileSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");

      $compile(el);

      setTimeout(() => {
        expect(compileSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it("resumes remaining directive compilation after template received", (done) => {
      const otherCompileSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return { templateUrl: "/public/my_directive.html" };
        },
        myOtherDirective: () => {
          return { compile: otherCompileSpy };
        },
      });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");

      $compile(el);

      setTimeout(() => {
        expect(otherCompileSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it("resumes child compilation after template received", (done) => {
      const otherCompileSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return { templateUrl: "/public/my_other_directive.html" };
        },
        myOtherDirective: () => {
          return { compile: otherCompileSpy };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");

      $compile(el);

      setTimeout(() => {
        expect(otherCompileSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it("supports functions as values", async () => {
      const templateUrlSpy = jasmine
        .createSpy()
        .and.returnValue("/public/my_directive.html");
      registerDirectives({
        myDirective: () => {
          return {
            templateUrl: templateUrlSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");

      $compile(el);
      await wait();
      expect(templateUrlSpy.calls.first().args[0][0]).toBe(el[0]);
      expect(templateUrlSpy.calls.first().args[1].myDirective).toBeDefined();
    });

    it("does not allow templateUrl directive after template directive", () => {
      registerDirectives({
        myDirective: () => {
          return { template: "<div></div>" };
        },
        myOtherDirective: () => {
          return { templateUrl: "/public/my_other_directive.html" };
        },
      });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");
      expect(() => {
        $compile(el);
      }).toThrowError();
    });

    it("does not allow template directive after templateUrl directive", (done) => {
      registerDirectives({
        myDirective: () => {
          return { templateUrl: "/public/my_directive.html" };
        },
        myOtherDirective: () => {
          return { template: "<div></div>" };
        },
      });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");

      $compile(el);

      setTimeout(() => {
        expect(el.childElementCount).toBe(1);
        done();
      }, 10);
    });

    it("links the directive when public link function is invoked", (done) => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            templateUrl: "/public/my_directive.html",
            link: linkSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");

      const linkFunction = $compile(el);

      linkFunction($rootScope);

      setTimeout(() => {
        expect(linkSpy).toHaveBeenCalled();
        expect(linkSpy.calls.first().args[0]).toBe($rootScope);
        expect(linkSpy.calls.first().args[1]).toBe(el);
        expect(linkSpy.calls.first().args[2].myDirective).toBeDefined();
        done();
      }, 100);
    });

    it("links child elements when public link function is invoked", (done) => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return { templateUrl: "/public/my_other_directive.html" };
        },
        myOtherDirective: () => {
          return { link: linkSpy };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");

      const linkFunction = $compile(el);

      linkFunction($rootScope);
      setTimeout(() => {
        expect(linkSpy).toHaveBeenCalled();
        expect(linkSpy.calls.first().args[0]).toBe($rootScope);
        expect(linkSpy.calls.first().args[1]).toBe(el.firstChild);
        expect(linkSpy.calls.first().args[2].myOtherDirective).toBeDefined();
        done();
      }, 100);
    });

    it("links when template received if node link function has been invoked", (done) => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            templateUrl: "/public/my_directive.html",
            link: linkSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");

      const linkFunction = $compile(el)($rootScope); // link first

      setTimeout(() => {
        expect(linkSpy).toHaveBeenCalled();
        expect(linkSpy.calls.argsFor(0)[0]).toBe($rootScope);
        expect(linkSpy.calls.argsFor(0)[1][0]).toBe(el[0]);
        expect(linkSpy.calls.argsFor(0)[2].myDirective).toBeDefined();
        done();
      }, 10);
    });

    it("links directives that were compiled earlier", (done) => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            link: linkSpy,
          };
        },
        myOtherDirective: () => {
          return { templateUrl: "/public/my_directive.html" };
        },
      });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");

      let linkFunction = $compile(el);

      linkFunction($rootScope);

      setTimeout(() => {
        expect(linkSpy).toHaveBeenCalled();
        expect(linkSpy.calls.argsFor(0)[0]).toBe($rootScope);
        expect(linkSpy.calls.argsFor(0)[1]).toBe(el);
        expect(linkSpy.calls.argsFor(0)[2].myDirective).toBeDefined();
        done();
      }, 100);
    });

    it("retains isolate scope directives from earlier", (done) => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            scope: { val: "=myDirective" },
            link: linkSpy,
          };
        },
        myOtherDirective: () => {
          return { templateUrl: "/public/my_directive.html" };
        },
      });
      reloadModules();
      const el = $('<div my-directive="42" my-other-directive></div>');

      const linkFunction = $compile(el);
      linkFunction($rootScope);

      setTimeout(() => {
        expect(linkSpy).toHaveBeenCalled();
        expect(linkSpy.calls.first().args[0]).toBeDefined();
        expect(linkSpy.calls.first().args[0]).not.toBe($rootScope);
        expect(linkSpy.calls.first().args[0].val).toBe(42);
        done();
      }, 100);
    });

    it("supports isolate scope directives with templateUrls", (done) => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            scope: { val: "=myDirective" },
            link: linkSpy,
            templateUrl: "/public/my_directive.html",
          };
        },
      });
      reloadModules();
      const el = $('<div my-directive="42"></div>');

      $compile(el)($rootScope);
      setTimeout(() => {
        expect(linkSpy).toHaveBeenCalled();
        expect(linkSpy.calls.first().args[0]).not.toBe($rootScope);
        expect(linkSpy.calls.first().args[0].val).toBe(42);
        done();
      }, 10);
    });

    it("links children of isolate scope directives with templateUrls", (done) => {
      const linkSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            scope: { val: "=myDirective" },
            templateUrl: "/public/my_child_directive.html",
          };
        },
        myChildDirective: () => {
          return {
            link: linkSpy,
          };
        },
      });
      reloadModules();
      const el = $('<div my-directive="42"></div>');
      $compile(el)($rootScope);

      setTimeout(() => {
        expect(linkSpy).toHaveBeenCalled();
        expect(linkSpy.calls.first().args[0]).not.toBe($rootScope);
        expect(linkSpy.calls.first().args[0].val).toBe(42);
        done();
      }, 50);
    });

    it("sets up controllers for all controller directives", (done) => {
      let myDirectiveControllerInstantiated,
        myOtherDirectiveControllerInstantiated;
      registerDirectives({
        myDirective: () => {
          return {
            controller: function MyDirectiveController() {
              myDirectiveControllerInstantiated = true;
            },
          };
        },
        myOtherDirective: () => {
          return {
            templateUrl: "/public/my_directive.html",
            controller: function MyOtherDirectiveController() {
              myOtherDirectiveControllerInstantiated = true;
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive my-other-directive></div>");

      $compile(el)($rootScope);

      //requests[0].respond(200, {}, "<div></div>");
      setTimeout(() => {
        expect(myDirectiveControllerInstantiated).toBe(true);
        expect(myOtherDirectiveControllerInstantiated).toBe(true);
        done();
      }, 100);
    });
  });

  describe("with transclusion", () => {
    it("makes transclusion available to link fn when template arrives", (done) => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            templateUrl: "/public/my_directive.html",
            link: function (scope, element, attrs, ctrl, transclude) {
              element.firstChild.append(transclude());
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclude></div></div>");

      const linkFunction = $compile(el);

      linkFunction($rootScope); // then link
      setTimeout(() => {
        expect(el.outerHTML.match(/from-template/)).toBeTruthy();
        done();
      }, 100);
    });

    it("is only allowed once", async () => {
      const otherCompileSpy = jasmine.createSpy();
      registerDirectives({
        myTranscluder: () => {
          return {
            priority: 1,
            transclude: true,
            templateUrl: "/public/my_directive.html",
          };
        },
        mySecondTranscluder: () => {
          return {
            priority: 0,
            transclude: true,
            compile: otherCompileSpy,
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder my-second-transcluder></div>");

      $compile(el);
      await wait();

      expect(otherCompileSpy).not.toHaveBeenCalled();
    });
  });

  describe("transclude", () => {
    it("removes the children of the element from the DOM", () => {
      registerDirectives({
        myTranscluder: () => {
          return { transclude: true };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div>Must go</div></div>");

      $compile(el);
      expect(el.innerHTML).toBe("");
    });

    it("compiles child elements", async () => {
      const insideCompileSpy = jasmine.createSpy();
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<ng-transclude></ng-transclude>",
          };
        },
        insideTranscluder: () => {
          return {
            compile() {
              insideCompileSpy();
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div inside-transcluder></div></div>");
      $compile(el)($rootScope);
      await wait();
      expect(insideCompileSpy).toHaveBeenCalledTimes(1);
    });

    it("makes contents available to link function", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div in-template></div>",
            link: function (scope, element, attrs, ctrl, transclude) {
              const res = transclude();
              element.append(res);
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transcluder></div></div>");

      $compile(el)($rootScope);
      expect(el.outerHTML.match(/my-transcluder/)).toBeTruthy();
    });

    it("is only allowed once per element", () => {
      registerDirectives({
        myTranscluder: () => {
          return { transclude: true };
        },
        mySecondTranscluder: () => {
          return { transclude: true };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder my-second-transcluder></div>");

      expect(() => {
        $compile(el);
      }).toThrowError();
    });

    it("makes scope available to link functions inside", async () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            link: function (scope, element, attrs, ctrl, transclude) {
              const res = transclude();
              element.append(res);
            },
          };
        },
        myInnerDirective: () => {
          return {
            link: function (scope, element) {
              element.innerHTML = scope.anAttr;
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div my-inner-directive></div></div>");

      $rootScope.anAttr = "Hello from root";
      $compile(el)($rootScope);
      await wait();
      expect(el.innerHTML.match(/Hello from root/)).toBeTruthy();
    });

    it("does not use the inherited scope of the directive", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            scope: true,
            link: function (scope, element, attrs, ctrl, transclude) {
              scope.anAttr = "Shadowed attribute";
              element.append(transclude());
            },
          };
        },
        myInnerDirective: () => {
          return {
            link: function (scope, element) {
              element.innerHTML = scope.anAttr;
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div my-inner-directive></div></div>");

      $rootScope.anAttr = "Hello from root";
      $compile(el)($rootScope);
      expect(el.innerHTML.match(/Hello from root/)).toBeTruthy();
    });

    it("contents are destroyed along with transcluding directive", async () => {
      const watchSpy = jasmine.createSpy();
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            scope: true,
            link: function (scope, element, attrs, ctrl, transclude) {
              element.append(transclude());
              scope.$on("destroyNow", () => {
                scope.$destroy();
              });
            },
          };
        },
        myInnerDirective: () => {
          return {
            link: function (scope) {
              watchSpy();
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div my-inner-directive>TEST</div>");
      $compile(el)($rootScope);

      await wait();
      expect(watchSpy.calls.count()).toBe(1);

      $rootScope.$broadcast("destroyNow");
      await wait();
      expect(watchSpy.calls.count()).toBe(1);
    });

    it("allows passing another scope to transclusion function", async () => {
      const otherLinkSpy = jasmine.createSpy();
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            scope: {},
            template: "<div></div>",
            link: function (scope, element, attrs, ctrl, transclude) {
              const mySpecialScope = scope.$new();
              mySpecialScope.specialAttr = 42;
              transclude(mySpecialScope);
            },
          };
        },
        myOtherDirective: () => {
          return { link: otherLinkSpy };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div my-other-directive></div></div>");

      $compile(el)($rootScope);
      await wait();
      const transcludedScope = otherLinkSpy.calls.first().args[0];
      expect(transcludedScope.specialAttr).toBe(42);
    });

    it("makes contents available to child elements", async () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div in-template></div>",
          };
        },
        inTemplate: () => {
          return {
            link: function (scope, element, attrs, ctrl, transcludeFn) {
              element.append(transcludeFn());
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclude></div></div>");

      $compile(el)($rootScope);
      await wait();
      expect(el.outerHTML.match(/in-transclude/)).toBeTruthy();
    });

    it("makes contents available to indirect child elements", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div><div in-template></div></div>",
          };
        },
        inTemplate: () => {
          return {
            link: function (scope, element, attrs, ctrl, transcludeFn) {
              element.append(transcludeFn());
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclude></div></div>");

      $compile(el)($rootScope);

      expect(el.outerHTML.match(/in-transclude/)).toBeTruthy();
    });

    it("supports passing transclusion function to public link function", async () => {
      registerDirectives({
        myTranscluder: function ($compile) {
          return {
            transclude: true,
            link: function (scope, element, attrs, ctrl, transclude) {
              const customTemplate = $("<div in-custom-template></div>");
              element.append(customTemplate);
              $compile(customTemplate)(scope, undefined, {
                parentBoundTranscludeFn: transclude,
              });
            },
          };
        },
        inCustomTemplate: () => {
          return {
            link: function (scope, element, attrs, ctrl, transclude) {
              element.append(transclude());
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclude></div></div>");

      $compile(el)($rootScope);
      await wait();
      expect(el.outerHTML.match(/in-transclude/)).toBeTruthy();
    });

    it("destroys scope passed through public link fn at the right time", async () => {
      const watchSpy = jasmine.createSpy();
      registerDirectives({
        myTranscluder: function ($compile) {
          return {
            transclude: true,
            link: function (scope, element, attrs, ctrl, transclude) {
              const customTemplate = $("<div in-custom-template></div>");
              element.append(customTemplate);
              $compile(customTemplate)(scope, undefined, {
                parentBoundTranscludeFn: transclude,
              });
            },
          };
        },
        inCustomTemplate: () => {
          return {
            scope: true,
            link: function (scope, element, attrs, ctrl, transclude) {
              element.append(transclude());
              scope.$on("destroyNow", () => {
                scope.$destroy();
              });
            },
          };
        },
        inTransclude: () => {
          return {
            link: function (scope) {
              watchSpy();
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclude></div></div>");

      $compile(el)($rootScope);

      await wait();
      expect(watchSpy.calls.count()).toBe(1);

      $rootScope.$broadcast("destroyNow");
      await wait();
      expect(watchSpy.calls.count()).toBe(1);
    });

    it("makes contents available to controller", () => {
      let transclude;
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div ng-transclude></div>",
            controller: function ($transclude) {
              transclude = $transclude;
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclude></div></div>");
      $compile(el)($rootScope);

      expect(transclude().outerHTML.match(/in-transclude/)).toBeTruthy();
    });
  });

  describe("clone attach function", () => {
    it("can be passed to public link fn", () => {
      registerDirectives({});
      reloadModules();
      const el = $("<div>Hello</div>");
      const myScope = $rootScope.$new();
      let gotEl, gotScope;

      $compile(el)(myScope, function (el, scope) {
        gotEl = el;
        gotScope = scope;
      });

      expect(gotEl.isEqualNode(el)).toBe(true);
      expect(gotScope).toBe(myScope);
    });

    it("causes compiled elements to be cloned", () => {
      registerDirectives({});
      reloadModules();
      const el = $("<div>Hello</div>");
      const myScope = $rootScope.$new();
      let gotClonedEl;

      $compile(el)(myScope, function (clonedEl) {
        gotClonedEl = clonedEl;
      });

      expect(gotClonedEl.isEqualNode(el)).toBe(true);
      expect(gotClonedEl).not.toBe(el);
    });

    it("causes cloned DOM to be linked", () => {
      let gotCompileEl, gotLinkEl;
      registerDirectives({
        myDirective: () => {
          return {
            compile: function (compileEl) {
              gotCompileEl = compileEl;
              return function link(scope, linkEl) {
                gotLinkEl = linkEl;
              };
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-directive></div>");
      const myScope = $rootScope.$new();

      $compile(el)(myScope, () => {});

      expect(gotCompileEl).not.toBe(gotLinkEl);
    });

    it("allows connecting transcluded content", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div in-template></div>",
            link: function (scope, element, attrs, ctrl, transcludeFn) {
              const myScope = scope.$new();
              transcludeFn(myScope, function (transclNode) {
                element.append(transclNode);
              });
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclude></div></div>");

      $compile(el)($rootScope);

      expect(el.outerHTML.match(/in-transclude/)).toBeTruthy();
    });

    it("can be used with default transclusion scope", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div in-template></div>",
            link: function (scope, element, attrs, ctrl, transcludeFn) {
              transcludeFn(function (transclNode) {
                element.append(transclNode);
              });
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div in-transclusion></div></div>");

      $compile(el)($rootScope);
      expect(el.outerHTML.match(/in-transclusion/)).toBeTruthy();
    });

    it("allows passing data to transclusion", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div in-template></div>",
            link: function (scope, element, attrs, ctrl, transcludeFn) {
              transcludeFn(function (transclNode, transclScope) {
                transclScope.dataFromTranscluder = "Hello from transcluder";
                element.append(transclNode);
              });
            },
          };
        },
        myOtherDirective: () => {
          return {
            link: function (scope, element) {
              element.innerHTML = scope.dataFromTranscluder;
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-transcluder><div my-other-directive></div></div>");

      $compile(el)($rootScope);
      expect(el.outerHTML.match(/Hello from transcluder/)).toBeTruthy();
    });
  });

  describe("element transclusion", () => {
    it("removes the element from the DOM", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: "element",
          };
        },
      });
      reloadModules();
      const el = $("<div><div my-transcluder></div></div>");

      $compile(el);
      expect(el.innerText).toBe("");
    });

    it("replaces the element with a comment", () => {
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: "element",
          };
        },
      });
      reloadModules();
      const el = $("<div><div my-transcluder></div></div>");

      $compile(el);

      expect(el.innerHTML).toEqual("<!---->");
    });

    it("includes directive attribute value in comment", () => {
      registerDirectives({
        myTranscluder: () => {
          return { transclude: "element" };
        },
      });
      reloadModules();
      const el = $("<div><div my-transcluder=42></div></div>");

      $compile(el);

      expect(el.innerHTML).toEqual("<!---->");
    });

    it("calls directive compile and link with comment", () => {
      let gotCompiledEl, gotLinkedEl;
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: "element",
            compile: function (compiledEl) {
              gotCompiledEl = compiledEl;
              return function (scope, linkedEl) {
                gotLinkedEl = linkedEl;
              };
            },
          };
        },
      });
      reloadModules();
      const el = $("<div><div my-transcluder></div></div>");

      $compile(el)($rootScope);

      expect(gotCompiledEl.nodeType).toBe(Node.COMMENT_NODE);
      expect(gotLinkedEl.nodeType).toBe(Node.COMMENT_NODE);
    });

    it("calls lower priority compile with original", () => {
      let gotCompiledEl;
      registerDirectives({
        myTranscluder: () => {
          return {
            priority: 2,
            transclude: true,
            compile: function (compiledEl) {
              gotCompiledEl = compiledEl;
            },
          };
        },
        myOtherDirective: () => {
          return {
            priority: 1,
            compile: function (compiledEl) {
              gotCompiledEl = compiledEl;
            },
          };
        },
      });
      reloadModules();
      const el = $("<div my-other-directive my-transcluder></div>");

      $compile(el);
      expect(gotCompiledEl.nodeType).toBe(Node.ELEMENT_NODE);
    });

    it("calls compile on child element directives", () => {
      const compileSpy = jasmine.createSpy();
      registerDirectives({
        myTranscluder: () => {
          return {
            transclude: true,
            template: "<div ng-transclude></div>",
          };
        },
        myOtherDirective: () => {
          return {
            compile: compileSpy,
          };
        },
      });
      reloadModules();
      const el = $(
        "<div><div my-transcluder><div my-other-directive></div></div></div>",
      );
      $compile(el)($rootScope);

      expect(compileSpy).toHaveBeenCalled();
    });

    it("compiles original element contents once", () => {
      const compileSpy = jasmine.createSpy();
      registerDirectives({
        myTranscluder: () => {
          return { transclude: true, template: "<div ng-transclude></div>" };
        },
        myOtherDirective: () => {
          return {
            compile: compileSpy,
          };
        },
      });
      reloadModules();
      const el = $(
        "<div><div my-transcluder><div my-other-directive></div></div></div>",
      );

      $compile(el)($rootScope);

      expect(compileSpy.calls.count()).toBe(1);
    });

    it("makes original element available for transclusion", () => {
      registerDirectives({
        myDouble: () => {
          return {
            transclude: true,
            template: "<div ng-transclude></div>",
            link: function (scope, el, attrs, ctrl, transclude) {
              transclude(function (clone) {
                el.children[0].textContent += clone.textContent;
              });
              transclude(function (clone) {
                el.children[0].textContent += clone.textContent;
              });
            },
          };
        },
      });
      reloadModules();
      const el = $("<div><div my-double>Hello</div></div>");

      $compile(el)($rootScope);
      expect(el.innerText).toBe("HelloHelloHello");
    });

    it("supports requiring controllers", () => {
      const MyController = function () {};
      let gotCtrl;
      registerDirectives({
        myCtrlDirective: () => {
          return { controller: MyController };
        },
        myTranscluder: () => {
          return {
            transclude: "element",
            link: function (scope, el, attrs, ctrl, transclude) {
              el.after(transclude());
            },
          };
        },
        myOtherDirective: () => {
          return {
            require: "^myCtrlDirective",
            link: function (scope, el, attrs, ctrl, transclude) {
              gotCtrl = ctrl;
            },
          };
        },
      });
      reloadModules();
      const el = $(
        "<div><div my-ctrl-directive my-transcluder><div my-other-directive>Hello</div></div>",
      );

      $compile(el)($rootScope);

      expect(gotCtrl).toBeDefined();
      expect(gotCtrl instanceof MyController).toBe(true);
    });
  });

  describe("interpolation", () => {
    it("is done for text nodes", async () => {
      registerDirectives({});
      reloadModules();
      const el = $("<div>My expression: {{myExpr}}</div>");
      $compile(el)($rootScope);

      await wait();
      expect(el.innerHTML).toEqual("My expression: ");

      $rootScope.myExpr = "Hello";
      await wait();
      expect(el.innerHTML).toEqual("My expression: Hello");
    });

    it("is done for attributes", async () => {
      registerDirectives({});
      reloadModules();
      const el = $('<img alt="{{myAltText}}">');
      $compile(el)($rootScope);

      await wait();
      expect(el.getAttribute("alt")).toEqual("");

      $rootScope.myAltText = "My favourite photo";

      await wait();
      expect(el.getAttribute("alt")).toEqual("My favourite photo");
    });

    it("fires observers on attribute expression changes", async () => {
      const observerSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            link: function (scope, element, attrs) {
              attrs.$observe("alt", observerSpy);
            },
          };
        },
      });
      reloadModules();
      const el = $('<img alt="{{myAltText}}" my-directive>');
      $compile(el)($rootScope);

      $rootScope.myAltText = "My favourite photo";
      await wait();
      expect(observerSpy.calls.mostRecent().args[0]).toEqual(
        "My favourite photo",
      );
    });

    it("fires observers just once upon registration", async () => {
      const observerSpy = jasmine.createSpy();
      registerDirectives({
        myDirective: () => {
          return {
            link: function (scope, element, attrs) {
              attrs.$observe("alt", observerSpy);
            },
          };
        },
      });
      reloadModules();
      const el = $('<img alt="{{myAltText}}" my-directive>');
      $compile(el)($rootScope);
      await wait();
      expect(observerSpy.calls.count()).toBe(1);
    });

    it("is done for attributes by the time other directive is linked", async () => {
      let gotMyAttr;
      registerDirectives({
        myDirective: () => {
          return {
            link: function (scope, element, attrs) {
              gotMyAttr = attrs.myAttr;
            },
          };
        },
      });
      reloadModules();
      const el = $('<div my-directive my-attr="{{myExpr}}"></div>');
      $rootScope.myExpr = "Hello";
      $compile(el)($rootScope);
      await wait();
      expect(gotMyAttr).toEqual("Hello");
    });

    it("is done for attributes by the time bound to iso scope", async () => {
      let gotMyAttr;
      registerDirectives({
        myDirective: () => {
          return {
            scope: { myAttr: "@" },
            link: function (scope, element, attrs) {
              gotMyAttr = scope.myAttr;
            },
          };
        },
      });
      reloadModules();
      const el = $('<div my-directive my-attr="{{myExpr}}"></div>');
      $rootScope.myExpr = "Hello";
      $compile(el)($rootScope);
      await wait();

      expect(gotMyAttr).toEqual("Hello");
    });

    it("is done for attributes so that changes during compile are reflected", async () => {
      registerDirectives({
        myDirective: () => {
          return {
            compile: function (element, attrs) {
              attrs.$set("myAttr", "{{myDifferentExpr}}");
            },
          };
        },
      });
      reloadModules();
      const el = $('<div my-directive my-attr="{{myExpr}}"></div>');
      $rootScope.myExpr = "Hello";
      $rootScope.myDifferentExpr = "Other Hello";
      $compile(el)($rootScope);
      await wait();

      expect(el.getAttribute("my-attr")).toEqual("Other Hello");
    });

    it("is done for attributes so that removal during compile is reflected", async () => {
      registerDirectives({
        myDirective: () => {
          return {
            compile: function (element, attrs) {
              attrs.$set("myAttr", null);
            },
          };
        },
      });
      reloadModules();
      const el = $('<div my-directive my-attr="{{myExpr}}"></div>');
      $rootScope.myExpr = "Hello";
      $compile(el)($rootScope);
      await wait();

      expect(el.getAttribute("my-attr")).toBeFalsy();
    });

    it("cannot be done for event handler attributes", () => {
      registerDirectives({});
      reloadModules();
      $rootScope.myFunction = () => {};
      const el = $('<button onclick="{{myFunction()}}"></button>');
      expect(() => {
        $compile(el)($rootScope);
      }).toThrowError();
    });

    it("denormalizes directive templates", () => {
      createInjector([
        "ng",
        function ($interpolateProvider, $compileProvider) {
          $interpolateProvider.startSymbol = "[[";
          $interpolateProvider.endSymbol = "]]";
          $compileProvider.directive("myDirective", () => {
            return {
              template: "Value is {{myExpr}}",
            };
          });
        },
      ]).invoke(async ($compile, $rootScope) => {
        const el = $("<div my-directive></div>");
        $rootScope.myExpr = 42;
        $compile(el)($rootScope);
        await wait();

        expect(el.innerHTML).toEqual("Value is 42");
      });
      expect().toBe();
    });
  });

  describe("components", () => {
    it("can be registered and become directives", () => {
      myModule.component("myComponent", {});
      const injector = createInjector(["ng", "myModule"]);
      expect(injector.has("myComponentDirective")).toBe(true);
    });

    it("are element directives with controllers", () => {
      let controllerInstantiated = false;
      let componentElement;
      myModule.component("myComponent", {
        controller: function ($element) {
          controllerInstantiated = true;
          componentElement = $element;
        },
        template: "<div></div>",
      });

      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);

      expect(controllerInstantiated).toBe(true);
      expect(el).toBe(componentElement);
    });

    it("cannot be applied to an attribute", async () => {
      let controllerInstantiated = false;
      registerComponent("myComponent", {
        restrict: "A", // Will be ignored
        controller: () => {
          controllerInstantiated = true;
        },
      });
      reloadModules();
      const el = $("<div my-component></div>");
      $compile(el)($rootScope);
      await wait();
      expect(controllerInstantiated).toBe(false);
    });

    it("has an isolate scope", async () => {
      let componentScope;
      myModule.component("myComponent", {
        controller: function ($scope) {
          componentScope = $scope;
        },
      });
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      await wait();
      expect(componentScope.$id).not.toBe($rootScope.$id);
      expect(componentScope.$parent.$id).toBe($rootScope.$id);
      expect(Object.getPrototypeOf(componentScope)).not.toBe($rootScope);
    });

    it("may have bindings which are attached to controller", async () => {
      let controllerInstance;
      myModule.component("myComponent", {
        bindings: {
          attr: "@",
          oneWay: "<",
          twoWay: "=",
        },
        controller: function () {
          controllerInstance = this;
        },
      });
      reloadModules();
      $rootScope.b = 42;
      $rootScope.c = 43;
      const el = $(
        '<my-component attr="a", one-way="b", two-way="c"></my-component>',
      );
      $compile(el)($rootScope);
      await wait();
      expect(controllerInstance.attr).toEqual("a");
      expect(controllerInstance.oneWay).toEqual(42);
      expect(controllerInstance.twoWay).toEqual(43);
    });

    it("may use a controller alias with controllerAs", async () => {
      let componentScope;
      let controllerInstance;
      myModule.component("myComponent", {
        controller: function ($scope) {
          componentScope = $scope;
          controllerInstance = this;
        },
        controllerAs: "myComponentController",
      });
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      await wait();
      expect(componentScope.myComponentController).toEqual(controllerInstance);
    });

    it('may use a controller alias with "controller as" syntax', async () => {
      let componentScope;
      let controllerInstance;
      myModule
        .controller("MyController", function ($scope) {
          componentScope = $scope;
          controllerInstance = this;
        })
        .component("myComponent", {
          controller: "MyController as myComponentController",
        });
      reloadModules();
      const el = $("<my-component></my-component");
      $compile(el)($rootScope);
      await wait();
      expect(componentScope.myComponentController).toEqual(controllerInstance);
    });

    it("has a default controller alias of $ctrl", async () => {
      let componentScope;
      let controllerInstance;
      myModule.component("myComponent", {
        controller: function ($scope) {
          componentScope = $scope;
          controllerInstance = this;
        },
      });
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      await wait();
      expect(componentScope.$ctrl).toEqual(controllerInstance);
    });

    it("may have a template", async () => {
      myModule.component("myComponent", {
        controller: function () {
          this.message = "Hello from component";
        },
        template: "{{ $ctrl.message }}",
      });
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      await wait();
      expect(el.innerText).toEqual("Hello from component");
    });

    it("may have a templateUrl", (done) => {
      myModule.component("myComponent", {
        controller: function () {
          this.message = "Hello from component";
        },
        templateUrl: "/my_component.html",
      });
      reloadModules();
      $templateCache.set("/my_component.html", "{{ $ctrl.message }}");
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      setTimeout(() => {
        expect(el.innerText).toEqual("Hello from component");
        done();
      }, 100);
    });

    it("may have a template function with DI support", async () => {
      myModule.constant("myConstant", 42).component("myComponent", {
        template: function (myConstant) {
          return "" + myConstant;
        },
      });
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      await wait();
      expect(el.innerText).toEqual("42");
    });

    it("may have a template function with array-wrapped DI", () => {
      myModule.constant("myConstant", 42).component("myComponent", {
        template: [
          "myConstant",
          function (c) {
            return "" + c;
          },
        ],
      });
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      expect(el.innerText).toEqual("42");
    });

    it("may inject $element and $attrs to template function", async () => {
      myModule.component("myComponent", {
        template: function ($element, $attrs) {
          return $element.setAttribute("copiedAttr", $attrs.myAttr);
        },
      });
      reloadModules();
      const el = $('<my-component my-attr="42"></my-component>');
      $compile(el)($rootScope);
      await wait();
      expect(el.getAttribute("copiedAttr")).toEqual("42");
    });

    it("may have a template function with DI support", async () => {
      myModule.constant("myConstant", 42).component("myComponent", {
        templateUrl: function (myConstant) {
          return "/template" + myConstant + ".html";
        },
      });
      $templateCache.set("/template42.html", "{{ 1 + 1 }}");
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      await wait();
      expect(el.innerText).toEqual("2");
    });

    it("may use transclusion", () => {
      myModule.component("myComponent", {
        transclude: true,
        template: "<div ng-transclude></div>",
      });
      reloadModules();
      const el = $("<my-component>Transclude me</my-component>");
      $compile(el)($rootScope);
      expect(el.children[0].innerText).toEqual("Transclude me");
    });

    it("may require other directive controllers", () => {
      let secondControllerInstance;
      myModule
        .component("first", {
          controller: () => {},
        })
        .component("second", {
          require: { first: "^" },
          controller: function () {
            secondControllerInstance = this;
          },
        });
      reloadModules();
      const el = $("<first><second></second></first>");
      $compile(el)($rootScope);
      expect(secondControllerInstance.first).toBeDefined();
    });
  });

  describe("lifecycle", () => {
    it("calls $onInit after all ctrls created before linking", () => {
      const invocations = [];
      myModule
        .component("first", {
          controller: function () {
            invocations.push("first controller created");
            this.$onInit = () => {
              invocations.push("first controller $onInit");
            };
          },
        })
        .directive("second", () => {
          return {
            controller: function () {
              invocations.push("second controller created");
              this.$onInit = () => {
                invocations.push("second controller $onInit");
              };
            },
            link: {
              pre: () => {
                invocations.push("second prelink");
              },
              post: () => {
                invocations.push("second postlink");
              },
            },
          };
        });

      reloadModules();
      const el = $("<first second></first>");
      $compile(el)($rootScope);
      expect(invocations).toEqual([
        "first controller created",
        "second controller created",
        "first controller $onInit",
        "second controller $onInit",
        "second prelink",
        "second postlink",
      ]);
    });

    it("calls $onDestroy when the scope is destroyed", () => {
      const destroySpy = jasmine.createSpy();
      myModule.component("myComponent", {
        controller: function () {
          this.$onDestroy = destroySpy;
        },
      });
      reloadModules();
      const el = $("<my-component></my-component>");
      $compile(el)($rootScope);
      $rootScope.$destroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it("calls $postLink after all linking is done", () => {
      const invocations = [];
      myModule
        .component("first", {
          controller: function () {
            this.$postLink = () => {
              invocations.push("first controller $postLink");
            };
          },
        })
        .directive("second", () => {
          return {
            controller: function () {
              this.$postLink = () => {
                invocations.push("second controller $postLink");
              };
            },
            link: () => {
              invocations.push("second postlink");
            },
          };
        });

      reloadModules();
      const el = $("<first><second></second></first>");
      $compile(el)($rootScope);
      expect(invocations).toEqual([
        "second postlink",
        "second controller $postLink",
        "first controller $postLink",
      ]);
    });

    it("does not call $onChanges for two-way bindings", () => {
      const changesSpy = jasmine.createSpy();
      myModule.component("myComponent", {
        bindings: {
          myBinding: "=",
        },
        controller: function () {
          this.$onChanges = changesSpy;
        },
      });
      reloadModules();
      const el = $('<my-component my-binding="42"></my-component>');
      $compile(el)($rootScope);
      expect(changesSpy).toHaveBeenCalled();
      expect(changesSpy.calls.mostRecent().args[0].myBinding).toBeUndefined();
    });

    it("calls $onChanges when binding changes", async () => {
      const changesSpy = jasmine.createSpy();
      myModule.component("myComponent", {
        bindings: {
          myBinding: "<",
        },
        controller: function () {
          this.$onChanges = function (scope) {
            changesSpy(scope);
          };
        },
      });
      reloadModules();
      $rootScope.aValue = 42;
      const el = $('<my-component my-binding="aValue"></my-component>');
      $compile(el)($rootScope);
      await wait();

      expect(changesSpy.calls.count()).toBe(1);
      $rootScope.aValue = 43;
      await wait();
      expect(changesSpy.calls.count()).toBe(2);

      const lastChanges = changesSpy.calls.mostRecent().args[0];
      expect(lastChanges.myBinding.currentValue).toBe(43);
      expect(lastChanges.myBinding.firstChange).toBe(true);
    });

    it("calls $onChanges when attribute changes", async () => {
      const changesSpy = jasmine.createSpy();
      let attrs;
      myModule.component("myComponent", {
        bindings: {
          myAttr: "@",
        },
        controller: function ($attrs) {
          this.$onChanges = function (val) {
            changesSpy(val);
          };
          attrs = $attrs;
        },
      });
      reloadModules();
      const el = $('<my-component my-attr="42"></my-component>');
      $compile(el)($rootScope);
      await wait();
      expect(changesSpy.calls.count()).toBe(1);
      attrs.$set("myAttr", "43");
      await wait();
      expect(changesSpy.calls.count()).toBe(2);
      const lastChanges = changesSpy.calls.mostRecent().args[0];
      expect(lastChanges.myAttr.currentValue).toBe("43");
      expect(lastChanges.myAttr.firstChange).toBe(true);
    });

    it("calls $onChanges once with multiple changes", async () => {
      const changesSpy = jasmine.createSpy();
      let attrs;
      myModule.component("myComponent", {
        bindings: {
          myBinding: "<",
          myAttr: "@",
        },
        controller: function ($attrs) {
          this.$onChanges = function (val) {
            changesSpy(val);
          };
          attrs = $attrs;
        },
      });
      reloadModules();
      $rootScope.aValue = 42;
      const el = $(
        '<my-component my-binding="aValue" my-attr="fourtyTwo"></my-component>',
      );
      $compile(el)($rootScope);
      await wait();

      expect(changesSpy.calls.count()).toBe(1);
      $rootScope.aValue = 43;

      await wait();
      expect(changesSpy.calls.count()).toBe(2);
      let lastChanges = changesSpy.calls.mostRecent().args[0];
      expect(lastChanges.myAttr.currentValue).toBe("fourtyTwo");

      attrs.$set("myAttr", "fourtyThree");
      await wait();
      expect(changesSpy.calls.count()).toBe(3);
      lastChanges = changesSpy.calls.mostRecent().args[0];
      expect(lastChanges.myAttr.currentValue).toBe("fourtyThree");
      lastChanges = changesSpy.calls.mostRecent().args[0];
      expect(lastChanges.myAttr.currentValue).toBe("fourtyThree");
    });

    it("runs $onChanges that tracks first changes", async () => {
      let $val;
      myModule.component("myComponent", {
        bindings: {
          myBinding: "<",
          yourBinding: "<",
        },
        controller: function () {
          this.$onChanges = function (val) {
            $val = val;
            this.innerValue = "myBinding is " + this.myBinding;
          };
        },
        template: "{{ $ctrl.innerValue }}",
      });
      reloadModules();
      $rootScope.aValue = 42;
      const el = $(
        '<my-component my-binding="aValue" your-binding="bValue" ></my-component>',
      );
      $compile(el)($rootScope);
      await wait();
      expect(el.innerText).toEqual("myBinding is 42");

      $rootScope.aValue = 43;
      await wait();

      expect(el.innerText).toEqual("myBinding is 43");
      expect($val.myBinding.firstChange).toBe(true);

      $rootScope.aValue = 44;
      await wait();

      expect(el.innerText).toEqual("myBinding is 44");
      expect($val.myBinding.firstChange).toBe(false);

      $rootScope.bValue = 43;
      await wait();

      expect($val.yourBinding.firstChange).toBe(true);

      $rootScope.bValue = 44;
      await wait();

      expect($val.yourBinding.firstChange).toBe(false);
    });

    it("runs $onChanges for all components in the same digest", async () => {
      const watchSpy = jasmine.createSpy();
      myModule
        .component("first", {
          bindings: { myBinding: "<" },
          controller: function () {
            this.$onChanges = function () {
              watchSpy();
            };
          },
        })
        .component("second", {
          bindings: { myBinding: "<" },
          controller: function () {
            this.$onChanges = function () {
              watchSpy();
            };
          },
        });
      reloadModules();

      $rootScope.aValue = 42;
      const el = $(
        "<div>" +
          '<first my-binding="aValue"></first>' +
          '<second my-binding="aValue"></second>' +
          "</div>",
      );
      $compile(el)($rootScope);
      await wait();
      // // Dirty watches always cause a second digest
      expect(watchSpy.calls.count()).toBe(2);

      $rootScope.aValue = 43;
      await wait();
      // plus one more for onchanges
      expect(watchSpy.calls.count()).toBe(4);
    });
  });

  describe("configuration", () => {
    it("should use $$sanitizeUriProvider for reconfiguration of the `aHrefSanitizationTrustedUrlList`", () => {
      createInjector([
        "ng",
        ($compileProvider, $$sanitizeUriProvider) => {
          const newRe = /safe:/;
          let returnVal;

          expect($compileProvider.aHrefSanitizationTrustedUrlList()).toBe(
            $$sanitizeUriProvider.aHrefSanitizationTrustedUrlList(),
          );
          $compileProvider.aHrefSanitizationTrustedUrlList(newRe);
          expect($$sanitizeUriProvider.aHrefSanitizationTrustedUrlList()).toBe(
            newRe,
          );
          expect($compileProvider.aHrefSanitizationTrustedUrlList()).toBe(
            newRe,
          );
        },
      ]);
    });

    it("should use $$sanitizeUriProvider for reconfiguration of the `imgSrcSanitizationTrustedUrlList`", () => {
      createInjector([
        "ng",
        ($compileProvider, $$sanitizeUriProvider) => {
          const newRe = /safe:/;
          let returnVal;

          expect($compileProvider.imgSrcSanitizationTrustedUrlList()).toBe(
            $$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList(),
          );
          $compileProvider.imgSrcSanitizationTrustedUrlList(newRe);
          expect($$sanitizeUriProvider.imgSrcSanitizationTrustedUrlList()).toBe(
            newRe,
          );
          expect($compileProvider.imgSrcSanitizationTrustedUrlList()).toBe(
            newRe,
          );
        },
      ]);
    });

    it("should allow strictComponentBindingsEnabled to be configured", () => {
      createInjector([
        "ng",
        ($compileProvider) => {
          expect($compileProvider.strictComponentBindingsEnabled()).toBe(false); // the default
          $compileProvider.strictComponentBindingsEnabled(true);
          expect($compileProvider.strictComponentBindingsEnabled()).toBe(true);
        },
      ]);
    });

    it("should register a directive", () => {
      myModule.directive("div", () => ({
        link(scope, element) {
          log = "OK";
          element.innerText = "SUCCESS";
        },
      }));
      reloadModules();
      const el = $compile("<div></div>")($rootScope);
      expect(el.innerText).toEqual("SUCCESS");
      expect(log).toEqual("OK");
    });

    it("should allow registration of multiple directives with same name", () => {
      myModule
        .directive("div", () => ({
          link: {
            pre: () => log.push("pre1"),
            post: () => log.push("post1"),
          },
        }))
        .directive("div", () => ({
          link: {
            pre: () => log.push("pre2"),
            post: () => log.push("post2"),
          },
        }));

      reloadModules();
      $compile("<div></div>")($rootScope);
      expect(log).toEqual(["pre1", "pre2", "post2", "post1"]);
    });

    it('should throw an exception if a directive is called "hasOwnProperty"', () => {
      expect(() => {
        myModule.directive("hasOwnProperty", () => {});
        reloadModules();
      }).toThrowError(/hasOwnProperty is not a valid directive name/);
    });

    it("should throw an exception if a directive name starts with a non-lowercase letter", () => {
      expect(() => {
        myModule.directive("BadDirectiveName", () => {});
        reloadModules();
      }).toThrowError(/The first character must be a lowercase letter/);
    });

    it("should throw an exception if a directive name has leading or trailing whitespace", () => {
      function assertLeadingOrTrailingWhitespaceInDirectiveName(name) {
        expect(() => {
          myModule.directive(name, () => {});
          createInjector(["myModule"]).invoke(($compile) => {});
        }).toThrowError(/modulerr/);
      }
      assertLeadingOrTrailingWhitespaceInDirectiveName(
        " leadingWhitespaceDirectiveName",
      );
      assertLeadingOrTrailingWhitespaceInDirectiveName(
        "trailingWhitespaceDirectiveName ",
      );
      assertLeadingOrTrailingWhitespaceInDirectiveName(
        " leadingAndTrailingWhitespaceDirectiveName ",
      );
    });

    it("should throw an exception if the directive name is not defined", () => {
      expect(() => {
        myModule.directive();
        createInjector(["myModule"]).invoke(($compile) => {});
      }).toThrowError(/areq/);
    });

    it("should ignore special chars before processing attribute directive name", () => {
      // a regression https://github.com/angular/angular.js/issues/16278
      myModule.directive("t", () => ({
        restrict: "A",
        link: {
          pre: () => log.push("pre"),
          post: () => log.push("post"),
        },
      }));
      reloadModules();
      $compile("<div t></div>")($rootScope);
      $compile("<div -t></div>")($rootScope);
      $compile("<div t></div>")($rootScope);
      expect(log.join("; ")).toEqual("pre; post; pre; post; pre; post");
    });

    it("should throw an exception if the directive factory is not defined", () => {
      expect(() => {
        myModule.directive("myDir");
        createInjector(["myModule"]).invoke(($compile) => {});
      }).toThrowError(/areq/);
    });

    it("should preserve context within declaration", async () => {
      myModule
        .directive("ff", () => {
          const declaration = {
            restrict: "E",
            template() {
              log.push(`ff template: ${this === declaration}`);
            },
            compile() {
              log.push(`ff compile: ${this === declaration}`);
              return () => {
                log.push(`ff post: ${this === declaration}`);
              };
            },
          };
          return declaration;
        })
        .directive("fff", () => {
          const declaration = {
            restrict: "E",
            link: {
              pre() {
                log.push(`fff pre: ${this === declaration}`);
              },
              post() {
                log.push(`fff post: ${this === declaration}`);
              },
            },
          };
          return declaration;
        })
        .directive("ffff", () => {
          const declaration = {
            restrict: "E",
            compile() {
              return {
                pre() {
                  log.push(`ffff pre: ${this === declaration}`);
                },
                post() {
                  log.push(`ffff post: ${this === declaration}`);
                },
              };
            },
          };
          return declaration;
        })
        .directive("fffff", () => {
          const declaration = {
            restrict: "E",
            templateUrl() {
              log.push(`fffff templateUrl: ${this === declaration}`);
              return "fffff.html";
            },
            link() {
              log.push(`fffff post: ${this === declaration}`);
            },
          };
          return declaration;
        });

      reloadModules();

      $templateCache.set("fffff.html", "");

      $compile("<ff></ff>")($rootScope);
      $compile("<fff></fff>")($rootScope);
      $compile("<ffff></ffff>")($rootScope);
      $compile("<fffff></fffff>")($rootScope);
      await wait();
      expect(log.join("; ")).toEqual(
        "ff template: true; " +
          "ff compile: true; " +
          "ff post: true; " +
          "fff pre: true; " +
          "fff post: true; " +
          "ffff pre: true; " +
          "ffff post: true; " +
          "fffff templateUrl: true; " +
          "fffff post: true",
      );
    });
  });

  describe("svg namespace transcludes", () => {
    // this method assumes some sort of sized SVG element is being inspected.
    function assertIsValidSvgCircle(elem) {
      expect(isUnknownElement(elem)).toBe(false);
      expect(isSVGElement(elem)).toBe(true);
      const box = elem.getBoundingClientRect();
      expect(box.width === 0 && box.height === 0).toBe(false);
    }

    beforeEach(() => {
      registerDefaultDirectives();
      reloadModules();
    });

    afterEach(() => {
      dealoc(element);
    });

    it("should handle transcluded svg elements", async () => {
      let element = $(
        "<div><svg svg-container>" +
          '<circle cx="4" cy="4" r="2"></circle>' +
          "</svg></div>",
      );
      element = $compile(element)($rootScope);
      document.body.appendChild(element);
      await wait();
      const circle = element.children[0].children[0];
      assertIsValidSvgCircle(circle);
      document.body.removeChild(element);
    });

    it("should handle custom svg elements inside svg tag", async () => {
      let element = $(
        '<div><svg width="300" height="300">' +
          "<circle svg-circle></circle>" +
          "</svg></div>",
      );
      $compile(element)($rootScope);
      document.body.appendChild(element);
      await wait();
      const circle = element.querySelector("circle");
      assertIsValidSvgCircle(circle);
      document.body.removeChild(element);
    });

    it("should handle transcluded custom svg elements", async () => {
      let element = $(
        "<div><svg svg-container>" +
          "<svg-circle></svg-circle>" +
          "</svg></div>",
      );
      document.body.appendChild(element);
      $compile(element)($rootScope);
      await wait();
      const circle = element.querySelector("circle");
      assertIsValidSvgCircle(circle);
      document.body.removeChild(element);
    });

    it("should handle directives with templates that manually add the transclude further down", async () => {
      element = $(
        "<div><svg svg-custom-transclude-container>" +
          '<circle cx="2" cy="2" r="1"></circle></svg>' +
          "</div>",
      );
      element = $compile(element)($rootScope);
      document.body.appendChild(element);
      await wait();
      const circle = element.querySelector("circle");
      assertIsValidSvgCircle(circle);
    });

    it("should support directives with SVG templates and a slow url that are stamped out later by a transcluding directive", async () => {
      window.angular.module("test", []).directive("svgCircleUrl", () => ({
        replace: true,
        templateUrl: "/mock/circle-svg",
        templateNamespace: "SVG",
      }));

      injector.loadNewModules(["test"]);
      element = $compile(
        '<svg><g ng-repeat="l in list"><svg-circle-url></svg-circle-ur></g></svg>',
      )($rootScope);

      // initially the template is not yet loaded
      $rootScope.list = [1];
      await wait();
      expect(element.querySelectorAll("circle").length).toBe(0);
      await wait(100);

      // template is loaded and replaces the existing nodes
      expect(element.querySelectorAll("circle").length).toBe(1);

      $rootScope.list.push(2);
      await wait(200);

      expect(element.querySelectorAll("circle").length).toBe(2);
    });
  });

  describe("compile phase", () => {
    it("should be able to compile text nodes at the root", async () => {
      element = $("<div>Name: {{name}}<br />\nColor: {{color}}</div>");
      $rootScope.name = "Lucas";
      $rootScope.color = "blue";
      $compile(element)($rootScope);
      await wait();
      expect(element.textContent).toEqual("Name: Lucas\nColor: blue");
    });

    it("should not blow up when elements with no childNodes property are compiled", async () => {
      // it turns out that when a browser plugin is bound to a DOM element (typically <object>),
      // the plugin's context rather than the usual DOM apis are exposed on this element, so
      // childNodes might not exist.

      element = $("<div>{{1+2}}</div>");

      try {
        element.childNodes[1] = {
          nodeType: 3,
          nodeName: "OBJECT",
          textContent: "fake node",
        };
      } catch (e) {
        /* empty */
      }

      $compile(element)($rootScope);
      await wait();

      // object's children can't be compiled in this case, so we expect them to be raw
      expect(element.innerHTML).toBe("3");
    });

    it('should detect anchor elements with the string "SVG" in the `href` attribute as an anchor', async () => {
      ELEMENT.innerHTML =
        '<div><a href="/ID_SVG_ID">' +
        '<span ng-if="true">Should render</span>' +
        "</a></div>";

      bootstrapDefaultApplication();
      await wait();
      expect(ELEMENT.querySelector("span").innerText).toContain(
        "Should render",
      );
    });

    it("should allow changing the template structure after the current node", async () => {
      myModule.directive("after", () => ({
        compile(element) {
          element.append($("<span log>B</span>"));
        },
      }));
      reloadModules();
      element = $compile("<div><div after>A</div></div>")($rootScope);
      await wait();
      expect(element.textContent).toBe("AB");
    });

    it("should allow changing the template structure after the current node inside ngRepeat", async () => {
      myModule.directive("after", () => ({
        compile(element) {
          element.append($("<span log>B</span>"));
        },
      }));

      reloadModules();
      element = $compile(
        '<div><div ng-repeat="i in [1,2]"><div after>A</div></div></div>',
      )($rootScope);
      await wait();
      expect(element.textContent).toBe("ABAB");
    });

    it("should allow modifying the DOM structure in post link fn", async () => {
      myModule.directive("removeNode", () => ({
        link($scope, $element) {
          $element.parentElement.removeChild($element);
        },
      }));
      reloadModules();
      element = $compile(
        "<div><div remove-node></div><div>{{test}}</div></div>",
      )($rootScope);
      $rootScope.test = "Hello";
      await wait();
      expect(element.children.length).toBe(1);
      expect(element.textContent).toBe("Hello");
    });
  });

  describe("error handling", () => {
    it("should handle exceptions", () => {
      myModule
        .factory("$exceptionHandler", () => {
          return (exception) => {
            log.push(exception);
          };
        })
        .directive("factoryError", () => {
          throw "FactoryError";
        })
        .directive("templateError", () => ({
          compile() {
            throw "TemplateError";
          },
        }))
        .directive("linkingError", () => () => {
          throw "LinkingError";
        });
      // we have to create the injector here because the decorate is not able to override
      // exception handler on the defaultModule
      createInjector(["myModule"]).invoke(($compile, $rootScope) => {
        element = $compile(
          "<div factory-error template-error linking-error></div>",
        )($rootScope);
        expect(log[0]).toEqual("FactoryError");
        expect(log[1]).toEqual("TemplateError");
        expect(log[2]).toEqual("LinkingError");
      });
    });
  });

  describe("compiler control", () => {
    describe("priority", () => {
      it("should honor priority", () => {
        registerDefaultDirectives();
        reloadModules();
        element = $compile(
          '<span log="L" high-log="H" data-medium-log="M"></span>',
        )($rootScope);
        expect(log.join("; ")).toEqual("L; M; H");
      });
    });

    describe("terminal", () => {
      it("should prevent further directives from running", () => {
        registerDefaultDirectives();
        reloadModules();

        element = $compile('<div negative-stop><a set="FAIL">OK</a></div>')(
          $rootScope,
        );
        expect(element.textContent).toEqual("OK");
      });

      it("should prevent further directives from running, but finish current priority level", () => {
        // class is processed after attrs, so putting log in class will put it after
        // the stop in the current level. This proves that the log runs after stop
        registerDefaultDirectives();
        reloadModules();

        element = $compile(
          '<div high-log medium-stop log medium-log><a set="FAIL">OK</a></div>',
        )($rootScope);
        expect(element.textContent).toEqual("OK");
        expect(log).toEqual(["MEDIUM", "HIGH"]);
      });
    });

    describe("restrict", () => {
      it("should allow restriction of availability", () => {
        Object.entries({ div: "E", attr: "A", all: "EA" }).forEach(
          ([name, restrict]) => {
            myModule.directive(name, () => ({
              restrict,
              compile: () => (scope, element, attr) => {
                log.push(name);
              },
            }));
          },
        );

        reloadModules();
        dealoc($compile('<span div class="div"></span>')($rootScope));
        expect(log[0]).toBeUndefined();

        dealoc($compile("<div></div>")($rootScope));
        expect(log[0]).toBe("div");

        dealoc($compile('<attr class="attr"></attr>')($rootScope));
        expect(log[1]).toBeUndefined();

        dealoc($compile("<span attr></span>")($rootScope));
        expect(log[1]).toBe("attr");

        dealoc($compile("<clazz clazz></clazz>")($rootScope));
        expect(log[2]).toBeUndefined();

        dealoc($compile('<all class="all" all></all>')($rootScope));
      });

      it("should use EA rule as the default", () => {
        myModule.directive("defaultDir", () => ({
          compile() {
            log.push("defaultDir");
          },
        }));
        reloadModules();
        dealoc($compile("<span default-dir ></span>")($rootScope));
        expect(log[0]).toEqual("defaultDir");

        dealoc($compile("<default-dir></default-dir>")($rootScope));
        expect(log[1]).toEqual("defaultDir");

        dealoc($compile('<span class="default-dir"></span>')($rootScope));
        expect(log[2]).toBeUndefined();
      });
    });

    describe("template", () => {
      let attrs;
      beforeEach(() => {
        myModule
          .directive("replace", () => ({
            restrict: "A",
            replace: true,
            template:
              '<div class="log" style="width: 10px" high-log>Replace!</div>',
            compile(element, attr) {
              attr.$set("compiled", "COMPILED");
              element.compiled = true;
              expect(element).toBe(attr.$$element);
            },
          }))
          .directive("nomerge", () => ({
            restrict: "A",
            replace: true,
            template: '<div class="log" id="myid" high-log>No Merge!</div>',
            compile(element, attr) {
              attr.$set("compiled", "COMPILED");
              expect(element).toBe(attr.$$element);
            },
          }))
          .directive("append", () => ({
            restrict: "A",
            template:
              '<div class="log" style="width: 10px" high-log>Append!</div>',
            compile(element, attr) {
              attr.$set("compiled", "COMPILED");
              expect(element).toBe(attr.$$element);
            },
          }))
          .directive("replaceWithInterpolatedClass", () => ({
            replace: true,
            template:
              '<div class="class_{{1+1}}">Replace with interpolated class!</div>',
            compile(element, attr) {
              attr.$set("compiled", "COMPILED");
              expect(element).toBe(attr.$$element);
            },
          }))
          .directive("replaceWithInterpolatedStyle", () => ({
            replace: true,
            template:
              '<div style="width:{{1+1}}px">Replace with interpolated style!</div>',
            compile(element, attr) {
              attr.$set("compiled", "COMPILED");
              expect(element).toBe(attr.$$element);
            },
          }))
          .directive("replaceWithTr", () => ({
            replace: true,
            template: "<tr><td>TR</td></tr>",
          }))
          .directive("replaceWithTd", () => ({
            replace: true,
            template: "<td>TD</td>",
          }))
          .directive("replaceWithTh", () => ({
            replace: true,
            template: "<th>TH</th>",
          }))
          .directive("replaceWithThead", () => ({
            replace: true,
            template: "<thead><tr><td>TD</td></tr></thead>",
          }))
          .directive("replaceWithTbody", () => ({
            replace: true,
            template: "<tbody><tr><td>TD</td></tr></tbody>",
          }))
          .directive("replaceWithTfoot", () => ({
            replace: true,
            template: "<tfoot><tr><td>TD</td></tr></tfoot>",
          }))
          .directive("replaceWithOption", () => ({
            replace: true,
            template: "<option>OPTION</option>",
          }))
          .directive("replaceWithOptgroup", () => ({
            replace: true,
            template: "<optgroup>OPTGROUP</optgroup>",
          }))
          .directive("logAttrs", () => ({
            link($scope, $element, $attrs) {
              attrs = $attrs;
            },
          }));
      });

      it("should replace element with template", () => {
        reloadModules();
        element = $compile("<div><div replace>ignore</div></div>")($rootScope);
        expect(element.childNodes[0].textContent).toEqual("Replace!");
        expect(element.childNodes[0].getAttribute("compiled")).toEqual(
          "COMPILED",
        );
      });

      it("should append element with template", async () => {
        reloadModules();
        element = $compile("<div><div append>ignore</div></div>")($rootScope);
        await wait();
        expect(element.textContent).toEqual("Append!");
        expect(element.childNodes[0].getAttribute("compiled")).toEqual(
          "COMPILED",
        );
      });

      it("should compile template when replacing", () => {
        reloadModules();
        element = $compile("<div><div replace>ignore</div></div>")($rootScope);
        expect(element.textContent).toEqual("Replace!");
      });

      it("should compile template when appending", () => {
        reloadModules();
        element = $compile("<div><div append>ignore</div></div>")($rootScope);
        expect(element.textContent).toEqual("Append!");
      });

      it("should merge attributes including style attr", () => {
        reloadModules();
        bootstrap(
          '<div replace class="medium-log" style="height: 20px"></div>',
        );
        const div = ELEMENT.childNodes[0];
        expect(div.classList.contains("medium-log")).toBe(true);
        expect(div.classList.contains("log")).toBe(true);
        expect(div.style.width).toBe("10px");
        expect(div.style.height).toBe("20px");
        expect(div.getAttribute("replace")).toEqual("");
        expect(div.getAttribute("high-log")).toEqual("");
      });

      it("should not merge attributes if they are the same", () => {
        reloadModules();
        bootstrap('<div nomerge class="medium-log" id="myid"></div>');
        const div = ELEMENT.childNodes[0];
        expect(div.classList.contains("medium-log")).toBe(true);
        expect(div.classList.contains("log")).toBe(true);
        expect(div.getAttribute("id")).toEqual("myid");
      });

      it("should correctly merge attributes that contain special characters", () => {
        reloadModules();
        element = bootstrap(
          '<div replace (click)="doSomething()" [value]="someExpression" ω="omega"></div>',
        );
        const div = ELEMENT.childNodes[0];
        expect(div.getAttribute("(click)")).toEqual("doSomething()");
        expect(div.getAttribute("[value]")).toEqual("someExpression");
        expect(div.getAttribute("ω")).toEqual("omega");
      });

      it('should not add white-space when merging an attribute that is "" in the replaced element', () => {
        reloadModules();
        element = $compile('<div><div replace class=""></div></div>')(
          $rootScope,
        );
        const div = element.childNodes[0];
        expect(div.classList.contains("log")).toBe(true);
        expect(div.getAttribute("class")).toBe("log");
      });

      it("should not set merged attributes twice in $attrs", () => {
        reloadModules();
        element = $compile(
          '<div><div log-attrs replace class="myLog"></div></div>',
        )($rootScope);
        const div = element.childNodes[0];
        expect(div.getAttribute("class")).toBe("myLog log");
        expect(attrs.class).toBe("myLog log");
      });

      it("should play nice with repeater when replacing", async () => {
        reloadModules();
        element = $compile(
          "<div>" + '<div ng-repeat="i in [1,2]" replace></div>' + "</div>",
        )($rootScope);
        await wait();
        expect(element.textContent).toEqual("Replace!Replace!");
      });

      it("should play nice with repeater when appending", async () => {
        reloadModules();
        element = $compile(
          "<div>" + '<div ng-repeat="i in [1,2]" append></div>' + "</div>",
        )($rootScope);
        await wait();
        expect(element.textContent).toEqual("Append!Append!");
      });

      it("should handle interpolated css class from replacing directive", async () => {
        reloadModules();
        element = $compile("<div replace-with-interpolated-class></div>")(
          $rootScope,
        );
        await wait();
        expect(element.classList.contains("class_2")).toBeTrue();
      });

      it("should merge interpolated css class", async () => {
        reloadModules();
        element = $compile('<div class="one {{cls}} three" replace></div>')(
          $rootScope,
        );
        await wait();

        $rootScope.cls = "two";
        await wait();

        expect(element.classList.contains("one")).toBeTrue();
        expect(element.classList.contains("two")).toBeTrue(); // interpolated
        expect(element.classList.contains("three")).toBeTrue();
        expect(element.classList.contains("log")).toBeTrue(); // merged from replace directive template
      });

      it("should merge interpolated css class with ngRepeat", async () => {
        reloadModules();
        element = $compile(
          "<div>" +
            '<div ng-repeat="i in [1]" class="one {{cls}} three" replace></div>' +
            "</div>",
        )($rootScope);
        $rootScope.cls = "two";
        await wait();
        const child = element.children[0];
        expect(child.classList.contains("one")).toBeTrue();
        expect(child.classList.contains("two")).toBeTrue(); // interpolated
        expect(child.classList.contains("three")).toBeTrue();
        expect(child.classList.contains("log")).toBeTrue(); // merged from replace directive template
      });

      describe("replace and not exactly one root element", () => {
        let templateVar;

        beforeEach(() => {
          myModule
            .decorator("$exceptionHandler", () => {
              return (exception, cause) => {
                throw new Error();
              };
            })
            .directive("template", () => ({
              replace: true,
              template: templateVar,
            }));

          createInjector(["myModule"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });
        });

        it("should throw if: no root element", () => {
          templateVar = "dada";
          expect(() => {
            $compile("<p template></p>");
          }).toThrowError(/tplrt/);
        });

        it("should throw if: multiple root elements", () => {
          templateVar = "<div></div><div></div>";
          expect(() => {
            $compile("<p template></p>");
          }).toThrowError(/tplrt/);
        });

        it("should not throw if the root element is accompanied by: whitespace", () => {
          templateVar = "  <div>Hello World!</div> \n";
          let element = $compile("<p template></p>")($rootScope);
          expect(element.textContent).toBe("Hello World!");
        });

        it("should not throw if the root element is accompanied by: comments", () => {
          templateVar = "<!-- oh hi --><div>Hello World!</div> \n";
          let element = $compile("<p template></p>")($rootScope);

          expect(element.textContent).toBe("Hello World!");
        });

        it("should not throw if the root element is accompanied by: comments + whitespace", () => {
          templateVar =
            "  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n";
          let element = $compile("<p template></p>")($rootScope);
          expect(element.textContent).toBe("Hello World!");
        });
      });

      it("should support templates with root <tr> tags", async () => {
        reloadModules();
        bootstrap("<div replace-with-tr></div>");
        await wait();
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/tr/i);
      });

      it("should support templates with root <td> tags", async () => {
        reloadModules();
        bootstrap("<div replace-with-td></div>");
        await wait();
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/td/i);
      });

      it("should support templates with root <th> tags", () => {
        reloadModules();
        bootstrap("<div replace-with-th></div>");
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/th/i);
      });

      it("should support templates with root <thead> tags", () => {
        reloadModules();
        bootstrap("<div replace-with-thead></div>");
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/thead/i);
      });

      it("should support templates with root <tbody> tags", () => {
        reloadModules();
        bootstrap("<div replace-with-tbody></div>");
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/tbody/i);
      });

      it("should support templates with root <tfoot> tags", () => {
        reloadModules();
        bootstrap("<div replace-with-tfoot></div>");
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/tfoot/i);
      });

      it("should support templates with root <option> tags", () => {
        reloadModules();
        bootstrap("<div replace-with-option></div>");
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/option/i);
      });

      it("should support templates with root <optgroup> tags", () => {
        reloadModules();
        expect(() => {
          bootstrap("<div replace-with-optgroup></div>");
        }).not.toThrow();
        expect(getNodeName(ELEMENT.firstChild)).toMatch(/optgroup/i);
      });

      it("should support SVG templates using directive.templateNamespace=svg", async () => {
        myModule.directive("svgAnchor", () => ({
          replace: true,
          template: '<a href="{{linkurl}}">{{text}}</a>',
          templateNamespace: "SVG",
          scope: {
            linkurl: "@svgAnchor",
            text: "@?",
          },
        }));
        reloadModules();
        bootstrap('<svg><g svg-anchor="/foo/bar" text="foo/bar!"></g></svg>');
        await wait();
        const child = ELEMENT.firstChild.firstChild;
        expect(getNodeName(child)).toMatch(/a/i);
        expect(isSVGElement(child)).toBe(true);
        expect(child.href.baseVal).toBe("/foo/bar");
      });

      it("should support MathML templates using directive.templateNamespace=math", async () => {
        myModule.directive("pow", () => ({
          replace: true,
          transclude: true,
          template: "<msup><mn>{{pow}}</mn></msup>",
          templateNamespace: "MATH",
          scope: {
            pow: "@pow",
          },
          link(scope, elm, attr, ctrl, transclude) {
            transclude((node) => {
              elm.prepend(node);
            });
          },
        }));
        reloadModules();
        element = $compile('<math><mn pow="2"><mn>8</mn></mn></math>')(
          $rootScope,
        );
        await wait();
        const child = element.firstChild;
        expect(getNodeName(child)).toMatch(/msup/i);
        expect(isUnknownElement(child)).toBe(false);
        expect(isHTMLElement(child)).toBe(false);
      });

      it("should keep prototype properties on directive", async () => {
        function DirectiveClass() {
          this.restrict = "E";
          this.template = "<p>{{value}}</p>";
        }

        DirectiveClass.prototype.compile = () => {
          return function (scope, element, attrs) {
            scope.value = "Test Value";
          };
        };

        myModule.directive(
          "templateUrlWithPrototype",
          () => new DirectiveClass(),
        );
        reloadModules();
        element = $compile(
          "<template-url-with-prototype><template-url-with-prototype>",
        )($rootScope);
        await wait();
        expect(element.childNodes[0].innerHTML).toEqual("Test Value");
      });
    });

    describe("template as function", () => {
      beforeEach(() => {
        myModule.directive("myDirective", () => ({
          replace: true,
          template($element, $attrs) {
            expect($element.textContent).toBe("original content");
            expect($attrs.myDirective).toBe("some value");
            return '<div id="templateContent">template content</div>';
          },
          compile($element, $attrs) {
            expect($element.textContent).toBe("template content");
            expect($attrs.id).toBe("templateContent");
          },
        }));
      });

      it("should evaluate `template` when defined as fn and use returned string as template", () => {
        reloadModules();
        element = $compile(
          '<div my-directive="some value">original content<div>',
        )($rootScope);
        expect(element.textContent).toEqual("template content");
      });
    });

    describe("templateUrl", () => {
      let $sce, errors;
      // let module, log, $compile, $rootScope, $sce, $templateCache, errors;

      beforeEach(() => {
        errors = [];
        myModule
          .decorator("$exceptionHandler", () => {
            return (exception, cause) => {
              errors.push(exception.message);
            };
          })
          .directive("hello", () => ({
            restrict: "A",
            templateUrl: "/mock/hello",
            transclude: true,
          }))
          .directive("401", () => ({
            restrict: "A",
            templateUrl: "/mock/401",
            transclude: true,
          }))
          .directive("cau", () => ({
            restrict: "A",
            templateUrl: "/mock/divexpr",
          }))
          .directive("crossDomainTemplate", () => ({
            restrict: "A",
            templateUrl: "http://example.com/should-not-load.html",
          }))
          .directive("trustedTemplate", () => ({
            restrict: "A",
            templateUrl() {
              return $sce.trustAsResourceUrl("http://localhost:3000/hello");
            },
          }))
          .directive("cError", () => ({
            restrict: "A",
            templateUrl: "/mock/empty",
            compile() {
              throw new Error("cError");
            },
          }))
          .directive("lError", () => ({
            restrict: "A",
            templateUrl: "/mock/empty",
            compile() {
              throw new Error("lError");
            },
          }))
          .directive("iHello", () => ({
            restrict: "A",
            replace: true,
            templateUrl: "/mock/div",
          }))
          .directive("iCau", () => ({
            restrict: "A",
            replace: true,
            templateUrl: "/mock/divexpr",
          }))
          .directive("iCError", () => ({
            restrict: "A",
            replace: true,
            templateUrl: "error.html",
            compile() {
              throw new Error("cError");
            },
          }))
          .directive("iLError", () => ({
            restrict: "A",
            replace: true,
            templateUrl: "error.html",
            compile() {
              throw new Error("lError");
            },
          }))
          .directive("replace", () => ({
            replace: true,
            template: "<span>Hello, {{name}}!</span>",
          }))
          .directive("replaceWithTr", () => ({
            replace: true,
            templateUrl: "tr.html",
          }))
          .directive("replaceWithTd", () => ({
            replace: true,
            templateUrl: "td.html",
          }))
          .directive("replaceWithTh", () => ({
            replace: true,
            templateUrl: "th.html",
          }))
          .directive("replaceWithThead", () => ({
            replace: true,
            templateUrl: "thead.html",
          }))
          .directive("replaceWithTbody", () => ({
            replace: true,
            templateUrl: "tbody.html",
          }))
          .directive("replaceWithTfoot", () => ({
            replace: true,
            templateUrl: "tfoot.html",
          }))
          .directive("replaceWithOption", () => ({
            replace: true,
            templateUrl: "option.html",
          }))
          .directive("replaceWithOptgroup", () => ({
            replace: true,
            templateUrl: "optgroup.html",
          }));

        createInjector(["myModule"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_, _$sce_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
            $sce = _$sce_;
          },
        );
      });

      it("should not load cross domain templates by default", async () => {
        $compile("<div cross-domain-template></div>")($rootScope);
        await wait();
        expect(errors[0]).toMatch(/insecurl/);
      });

      it("should trust what is already in the template cache", async () => {
        $templateCache.set(
          "http://example.com/should-not-load.html",
          "<span>example.com/cached-version</span>",
        );
        element = $compile("<div cross-domain-template></div>")($rootScope);
        expect(element.outerHTML).toEqual(
          '<div cross-domain-template=""></div>',
        );
        await wait();
        expect(element.outerHTML).toEqual(
          '<div cross-domain-template=""><span>example.com/cached-version</span></div>',
        );
      });

      it("should load cross domain templates when trusted", (done) => {
        element = $compile("<div trusted-template></div>")($rootScope);
        expect(element.outerHTML).toEqual('<div trusted-template=""></div>');
        setTimeout(() => {
          expect(element.outerHTML).toEqual(
            '<div trusted-template="">Hello</div>',
          );
          done();
        }, 100);
      });

      it("should append template via $http and cache it in $templateCache", (done) => {
        $templateCache.set("/mock/divexpr", "<span>Cau!</span>");
        element = $compile("<div><b hello>ignore</b><b cau>ignore</b></div>")(
          $rootScope,
        );

        expect(element.outerHTML).toEqual(
          '<div><b hello=""></b><b cau=""></b></div>',
        );

        setTimeout(() => {
          expect(element.outerHTML).toEqual(
            `<div><b hello="">Hello</b><b cau=""><span>Cau!</span></b></div>`,
          );
          done();
        }, 100);
      });

      it("should inline template via $http and cache it in $templateCache", (done) => {
        $templateCache.set("/mock/divexpr", "<span>Cau!</span>");
        element = $compile(
          "<div><b i-hello>ignore</b><b i-cau>ignore</b></div>",
        )($rootScope);
        expect(element.outerHTML).toEqual(
          '<div><b i-hello=""></b><b i-cau=""></b></div>',
        );

        setTimeout(() => {
          expect(element.outerHTML).toBe(
            '<div><div i-hello="">Hello</div><span i-cau="">Cau!</span></div>',
          );
          done();
        }, 100);
      });

      it("should compile, link and flush the template append", (done) => {
        $templateCache.set("/mock/hello", "<span>Hello, {{name}}!</span>");
        $rootScope.name = "Elvis";
        element = $compile('<div><b hello=""></b></div>')($rootScope);

        setTimeout(() => {
          expect(element.outerHTML).toEqual(
            '<div><b hello=""><span>Hello, Elvis!</span></b></div>',
          );
          done();
        }, 100);
      });

      it("should compile, link and flush the template inline", async () => {
        $templateCache.set("/mock/div", "<span>Hello, {{name}}!</span>");
        $rootScope.name = "Elvis";
        element = $compile("<div><b i-hello></b></div>")($rootScope);
        await wait();
        expect(element.outerHTML).toBe(
          '<div><span i-hello="">Hello, Elvis!</span></div>',
        );
      });

      it("should compile template when replacing element in another template", async () => {
        $templateCache.set("/mock/hello", "<div replace></div>");
        $rootScope.name = "Elvis";
        element = $compile('<div><b hello=""></b></div>')($rootScope);
        await wait();

        expect(element.outerHTML).toEqual(
          '<div><b hello=""><span replace="">Hello, Elvis!</span></b></div>',
        );
      });

      it("should compile template when replacing root element", async () => {
        $rootScope.name = "Elvis";
        element = $compile("<div replace></div>")($rootScope);
        await wait;
        expect(element.outerHTML).toEqual(
          '<span replace="">Hello, Elvis!</span>',
        );
      });

      it("should resolve widgets after cloning in append mode", async () => {
        $templateCache.set("/mock/divexpr", "<span>{{name}}</span>");
        $rootScope.greeting = "Hello";
        $rootScope.name = "Elvis";
        const template = $compile(
          "<div><b hello></b><b cau></b><b c-error></b><b l-error></b></div>",
        );

        let e1 = template($rootScope.$new(), () => {}); // clone
        expect(e1.innerText).toEqual("");

        let clone = $rootScope.$new();
        let e2 = template(clone, () => {}); // clone
        expect(e2.innerText).toEqual("");
        await wait(100);
        expect(e1.innerText).toEqual("HelloElvis  ");
        expect(e2.innerText).toEqual("HelloElvis  ");

        expect(errors.length).toEqual(2);
        expect(errors[0]).toEqual("cError");
        expect(errors[1]).toEqual("lError");

        dealoc(e1);
        dealoc(e2);
      });

      it("should resolve widgets after cloning in append mode without $templateCache", async () => {
        $rootScope.expr = "Elvis";
        const template = $compile("<div cau></div>");

        let e1 = template($rootScope.$new(), () => {}); // clone
        expect(e1.innerText).toEqual("");
        let e2 = template($rootScope.$new(), () => {}); // clone
        await wait(100);
        expect(e1.innerText).toEqual("Elvis");
        expect(e2.innerText).toEqual("Elvis");

        dealoc(e1);
        dealoc(e2);
      });

      it("should resolve widgets after cloning in inline mode", async () => {
        $templateCache.set("/mock/divexpr", "<span>{{name}}</span>");
        $rootScope.greeting = "Hello";
        $rootScope.name = "Elvis";
        const template = $compile(
          "<div>" +
            "<b i-hello></b>" +
            "<b i-cau></b>" +
            "<b i-c-error></b>" +
            "<b i-l-error></b>" +
            "</div>",
        );

        let e1 = template($rootScope.$new(), () => {}); // clone
        expect(e1.innerText).toEqual("");

        let e2 = template($rootScope.$new(), () => {}); // clone
        await wait(100);
        expect(e1.innerText).toEqual("HelloElvis");
        expect(e2.innerText).toEqual("HelloElvis");

        expect(errors.length).toEqual(2);
        dealoc(e1);
        dealoc(e2);
      });

      it("should resolve widgets after cloning in inline mode without $templateCache", async () => {
        $rootScope.expr = "Elvis";
        const template = $compile('<div i-cau=""></div>');

        let e1 = template($rootScope.$new(), () => {}); // clone
        expect(e1.innerText).toEqual("");
        let e2 = template($rootScope.$new(), () => {}); // clone
        await wait(100);
        expect(e1.innerText).toEqual("Elvis");
        expect(e2.innerText).toEqual("Elvis");

        dealoc(e1);
        dealoc(e2);
      });

      it("should be implicitly terminal and not compile placeholder content in append", () => {
        // we can't compile the contents because that would result in a memory leak
        $templateCache.set("/mock/hello", "Hello!");
        element = $compile('<div><b hello=""><div log></div></b></div>')(
          $rootScope,
        );

        expect(log[0]).toBeUndefined();
      });

      it("should be implicitly terminal and not compile placeholder content in inline", () => {
        // we can't compile the contents because that would result in a memory leak

        $templateCache.set("/mock/hello", "Hello!");
        element = $compile("<div><b i-hello><div log></div></b></div>")(
          $rootScope,
        );

        expect(log[0]).toBeUndefined();
      });

      // TODO: Figure out why the test fails twice
      it("should throw an error and clear element content if the template fails to load", (done) => {
        element = $compile("<div><b 401>content</b></div>")($rootScope);
        setTimeout(() => {
          expect(errors.length).toBe(2);
          expect(element.outerHTML).toBe('<div><b 401=""></b></div>');
          done();
        }, 1000);
      });

      it("should copy classes from pre-template node into linked element", async () => {
        window.angular.module("test1", ["ng"]).directive("test", () => ({
          templateUrl: "test.html",
          replace: true,
        }));
        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        $templateCache.set(
          "test.html",
          '<div class="template-class">Hello</div>',
        );
        element = $compile("<div test></div>")($rootScope, (node) => {
          node.classList.add("clonefn-class");
        });
        await wait();
        expect(element.classList.contains("template-class")).toBeTrue();
        expect(element.classList.contains("clonefn-class")).toBeTrue();
      });

      describe("delay compile / linking functions until after template is resolved", () => {
        let template, module;
        beforeEach(() => {
          log = [];
          dealoc(ELEMENT);
          module = angular.module("test1", ["ng"]).directive("hello", () => ({
            restrict: "A",
            templateUrl: "/mock/hello",
            transclude: true,
          }));

          function logDirective(name, priority, options) {
            module.directive(name, () =>
              extend(
                {
                  priority,
                  compile() {
                    log.push(`${name}-C`);
                    return {
                      pre() {
                        log.push(`${name}-PreL`);
                      },
                      post() {
                        log.push(`${name}-PostL`);
                      },
                    };
                  },
                },
                options || {},
              ),
            );
          }

          logDirective("first", 10);
          logDirective("second", 5, { templateUrl: "second.html" });
          logDirective("third", 3);
          logDirective("last", 0);

          logDirective("iFirst", 10, { replace: true });
          logDirective("iSecond", 5, {
            replace: true,
            templateUrl: "second.html",
          });
          logDirective("iThird", 3, { replace: true });
          logDirective("iLast", 0, { replace: true });

          angular
            .bootstrap(ELEMENT, ["test1"])
            .invoke((_$compile_, _$rootScope_, _$templateCache_) => {
              $compile = _$compile_;
              $rootScope = _$rootScope_;
              $templateCache = _$templateCache_;
            });
        });

        it("should flush after link append", async () => {
          $templateCache.set("second.html", "<div third>{{1+2}}</div>");
          template = $compile("<div><span first second last></span></div>");
          element = template($rootScope);
          expect(log[0]).toEqual("first-C");

          log.push("FLUSH");
          await wait();
          expect(log.join("; ")).toEqual(
            "first-C; FLUSH; second-C; last-C; third-C; " +
              "first-PreL; second-PreL; last-PreL; third-PreL; " +
              "third-PostL; last-PostL; second-PostL; first-PostL",
          );
          const span = element.children[0];
          expect(span.getAttribute("first")).toEqual("");
          expect(span.getAttribute("second")).toEqual("");
          expect(span.children[0].getAttribute("third")).toEqual("");
          expect(span.getAttribute("last")).toEqual("");

          expect(span.innerText).toEqual("3");
        });

        it("should flush after link inline", async () => {
          $templateCache.set("second.html", "<div i-third>{{1+2}}</div>");
          template = $compile(
            "<div><span i-first i-second i-last></span></div>",
          );
          element = template($rootScope);
          expect(log[0]).toEqual("iFirst-C");

          log.push("FLUSH");
          await wait();
          expect(log.join("; ")).toEqual(
            "iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C; " +
              "iFirst-PreL; iSecond-PreL; iThird-PreL; iLast-PreL; " +
              "iLast-PostL; iThird-PostL; iSecond-PostL; iFirst-PostL",
          );
          const div = element.children[0];
          expect(div.innerText).toEqual("3");
        });

        it("should flush before link append", async () => {
          $templateCache.set("second.html", "<div third>{{1+2}}</div>");
          template = $compile("<div><span first second last></span></div>");
          expect(log[0]).toEqual("first-C");
          log.push("FLUSH");
          //expect(log.join("; ")).toEqual("first-C; FLUSH; second-C; last-C; third-C");

          element = template($rootScope);
          await wait();
          expect(log.join("; ")).toEqual(
            "first-C; FLUSH; second-C; last-C; third-C; " +
              "first-PreL; second-PreL; last-PreL; third-PreL; " +
              "third-PostL; last-PostL; second-PostL; first-PostL",
          );

          const span = element.childNodes[0];
          expect(span.innerText).toEqual("3");
        });

        it("should flush before link inline", async () => {
          $templateCache.set("second.html", "<div i-third>{{1+2}}</div>");
          template = $compile(
            "<div><span i-first i-second i-last></span></div>",
          );
          expect(log[0]).toEqual("iFirst-C");
          log.push("FLUSH");
          element = template($rootScope);
          await wait();
          expect(log.join("; ")).toEqual(
            "iFirst-C; FLUSH; iSecond-C; iThird-C; iLast-C; " +
              "iFirst-PreL; iSecond-PreL; iThird-PreL; iLast-PreL; " +
              "iLast-PostL; iThird-PostL; iSecond-PostL; iFirst-PostL",
          );

          const div = element.childNodes[0];
          expect(div.innerText).toEqual("3");
        });

        it("should allow multiple elements in template", async () => {
          $templateCache.set("second.html", "before <b>mid</b> after");
          element = $compile("<div second></div>")($rootScope);
          await wait();
          expect(element.textContent).toEqual("before mid after");
        });

        it("should work when directive is on the root element", async () => {
          $templateCache.set(
            "/mock/hello",
            "<div>3==<span ng-transclude></span></div>",
          );
          element = $compile('<b hello="">{{1+2}}</b>')($rootScope);
          await wait();
          expect(element.textContent).toEqual("3==3");
        });

        describe("replace and not exactly one root element", () => {
          beforeEach(() => {
            dealoc(ELEMENT);
            window.angular = new Angular();
            module = window.angular
              .module("test1", ["ng"])
              .decorator("$exceptionHandler", () => {
                return (exception) => {
                  throw new Error(exception.message);
                };
              });
            module.directive("template", () => ({
              replace: true,
              templateUrl: "template.html",
            }));
          });

          // TODO these functions pass when being run in isolation. investigate scope pollution
          // it("should throw if: no root element", () => {
          //   $templateCache.set("template.html", "dada");

          //   expect(() => {
          //     $compile("<p template></p>")($rootScope);
          //     ;
          //   }).toThrowError(/tplrt/);
          // });

          // it("should throw if: multiple root elements", () => {
          //   $templateCache.set("template.html", "<div></div><div></div>");

          //   expect(() => {
          //     $compile("<p template></p>")($rootScope);
          //     $rootScope.$();
          //   }).toThrowError(/tplrt/);
          // });

          it("should not throw if the root element is accompanied by: whitespace", async () => {
            ELEMENT.innerHTML = "<p template></p>";
            angular.bootstrap(ELEMENT, ["test1"]).invoke(($templateCache) => {
              $templateCache.set("template.html", "<div>Hello World!</div> \n");
            });
            await wait();
            expect(ELEMENT.textContent).toBe("Hello World!");
          });

          it("should not throw if the root element is accompanied by: comments", async () => {
            ELEMENT.innerHTML = "<p template></p>";
            angular.bootstrap(ELEMENT, ["test1"]).invoke(($templateCache) => {
              $templateCache.set(
                "template.html",
                "<!-- oh hi --><div>Hello World!</div> \n",
              );
            });
            await wait();
            expect(ELEMENT.textContent).toBe("Hello World!");
          });

          it("should not throw if the root element is accompanied by: comments + whitespace", async () => {
            ELEMENT.innerHTML = "<p template></p>";
            angular.bootstrap(ELEMENT, ["test1"]).invoke(($templateCache) => {
              $templateCache.set(
                "template.html",
                "  <!-- oh hi -->  <div>Hello World!</div>  <!-- oh hi -->\n",
              );
            });
            await wait();
            expect(ELEMENT.textContent).toBe("Hello World!");
          });
        });

        it("should resume delayed compilation without duplicates when in a repeater", async () => {
          // this is a test for a regression
          // scope creation, isolate watcher setup, controller instantiation, etc should happen
          // only once even if we are dealing with delayed compilation of a node due to templateUrl
          // and the template node is in a repeater

          const controllerSpy = jasmine.createSpy("controller");

          module.directive("delayed", () => ({
            controller: controllerSpy,
            templateUrl: "delayed.html",
            scope: {
              title: "@",
            },
          }));

          createInjector(["test1"]).invoke(
            (_$compile_, _$rootScope_, _$templateCache_) => {
              $compile = _$compile_;
              $rootScope = _$rootScope_;
              $templateCache = _$templateCache_;
            },
          );

          $rootScope.coolTitle = "boom!";
          $templateCache.set("delayed.html", "<div>{{title}}</div>");
          element = $compile(
            '<div><div ng-repeat="i in [1,2]"><div delayed title="{{coolTitle + i}}"></div>|</div></div>',
          )($rootScope);

          await wait();
          expect(controllerSpy).toHaveBeenCalledTimes(2);
          expect(element.textContent).toBe("boom!1|boom!2|");
        });

        it("should support templateUrl with replace", async () => {
          // a regression https://github.com/angular/angular.js/issues/3792
          module.directive("simple", () => ({
            templateUrl: "/some.html",
            replace: true,
          }));

          dealoc(ELEMENT);
          ELEMENT.innerHTML = "<div simple></div>";

          angular
            .bootstrap(ELEMENT, ["test1"])
            .invoke(($templateCache, _$rootScope_) => {
              $templateCache.set(
                "/some.html",
                '<div ng-switch="i">' +
                  '<div ng-switch-when="1">i = 1</div>' +
                  "<div ng-switch-default>I dont know what `i` is.</div>" +
                  "</div>",
              );
              $rootScope = _$rootScope_;
            });

          await wait();
          $rootScope.i = 1;
          await wait();
          expect(ELEMENT.innerHTML).toContain("i = 1");
        });
      });

      it("should support templates with root <tr> tags", async () => {
        $templateCache.set("tr.html", "<tr><td>TR</td></tr>");
        expect(() => {
          element = $compile("<tr replace-with-tr></tr>")($rootScope);
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/tr/i);
      });

      it("should support templates with root <td> tags", async () => {
        $templateCache.set("td.html", "<td>TD</td>");
        expect(() => {
          element = $compile("<td replace-with-td></td>")($rootScope);
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/td/i);
      });

      it("should support templates with root <th> tags", async () => {
        $templateCache.set("th.html", "<th>TH</th>");
        expect(() => {
          element = $compile("<th replace-with-th></th>")($rootScope);
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/th/i);
      });

      it("should support templates with root <thead> tags", async () => {
        $templateCache.set("thead.html", "<thead><tr><td>TD</td></tr></thead>");
        expect(() => {
          element = $compile("<thead replace-with-thead></thead>")($rootScope);
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/thead/i);
      });

      it("should support templates with root <tbody> tags", async () => {
        $templateCache.set("tbody.html", "<tbody><tr><td>TD</td></tr></tbody>");
        expect(() => {
          element = $compile("<tbody replace-with-tbody></tbody>")($rootScope);
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/tbody/i);
      });

      it("should support templates with root <tfoot> tags", async () => {
        $templateCache.set("tfoot.html", "<tfoot><tr><td>TD</td></tr></tfoot>");
        expect(() => {
          element = $compile("<tfoot replace-with-tfoot></tfoot>")($rootScope);
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/tfoot/i);
      });

      it("should support templates with root <option> tags", async () => {
        $templateCache.set("option.html", "<option>OPTION</option>");
        expect(() => {
          element = $compile("<option replace-with-option></option>")(
            $rootScope,
          );
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/option/i);
      });

      it("should support templates with root <optgroup> tags", async () => {
        $templateCache.set("optgroup.html", "<optgroup>OPTGROUP</optgroup>");
        expect(() => {
          element = $compile("<optgroup replace-with-optgroup></optgroup>")(
            $rootScope,
          );
        }).not.toThrow();
        await wait();
        expect(getNodeName(element)).toMatch(/optgroup/i);
      });

      it("should support SVG templates using directive.templateNamespace=svg", async () => {
        myModule.directive("svgAnchor", () => ({
          replace: true,
          templateUrl: "template.html",
          templateNamespace: "SVG",
          scope: {
            linkurl: "@svgAnchor",
            text: "@?",
          },
        }));
        dealoc(ELEMENT);
        ELEMENT.innerHTML =
          '<svg><a svg-anchor="/foo/bar" text="foo/bar!"></a></svg>';
        angular.bootstrap(ELEMENT, ["myModule"]).invoke(($templateCache) => {
          $templateCache.set(
            "template.html",
            '<a href="{{linkurl}}">{{text}}</a>',
          );
        });

        await wait();
        const child = ELEMENT.firstChild;
        expect(getNodeName(child.firstChild)).toMatch(/a/i);
        expect(isSVGElement(child)).toBe(true);
        expect(child.firstChild.href).toMatch(/foo\/bar/);
      });

      it("should support MathML templates using directive.templateNamespace=math", async () => {
        myModule.directive("pow", () => ({
          replace: true,
          transclude: true,
          templateUrl: "template.html",
          templateNamespace: "math",
          scope: {
            pow: "@pow",
          },
          link(scope, elm, attr, ctrl, transclude) {
            transclude((node) => {
              elm.prepend(node);
            });
          },
        }));
        bootstrap('<math><mn pow="2"><mn>8</mn></mn></math>').invoke(
          ($templateCache, $rootScope, $compile) => {
            $templateCache.set(
              "template.html",
              "<msup><mn>{{pow}}</mn></msup>",
            );
          },
        );
        expect().toBe();
        await wait();
        const child = ELEMENT.firstChild;
        expect(getNodeName(child.firstChild.firstChild)).toMatch(/mn/i);
        expect(isUnknownElement(child)).toBe(false);
        expect(isHTMLElement(child)).toBe(false);
      });

      it("should keep prototype properties on sync version of async directive", async () => {
        function DirectiveClass() {
          this.restrict = "E";
          this.templateUrl = "test.html";
        }

        DirectiveClass.prototype.compile = () => {
          return function (scope, element, attrs) {
            scope.value = "Test Value";
          };
        };

        myModule.directive(
          "templateUrlWithPrototype",
          () => new DirectiveClass(),
        );

        createInjector(["myModule"]).invoke(
          async ($templateCache, $rootScope, $compile) => {
            $templateCache.set("test.html", "<p>{{value}}</p>");
            element = $compile(
              "<template-url-with-prototype><template-url-with-prototype>",
            )($rootScope);
            await wait();
            expect(element.querySelector("p").innerHTML).toEqual("Test Value");
          },
        );
      });
    });

    describe("templateUrl as function", () => {
      it("should evaluate `templateUrl` when defined as fn and use returned value as url", async () => {
        dealoc(ELEMENT);
        ELEMENT.innerHTML =
          '<div my-directive="some value">original content<div>';
        window.angular.module("test1", ["ng"]).directive("myDirective", () => ({
          replace: true,
          templateUrl($element, $attrs) {
            expect($element.textContent).toBe("original content");
            expect($attrs.myDirective).toBe("some value");
            return "my-directive.html";
          },
          compile($element, $attrs) {
            expect($element.textContent).toBe("template content");
            expect($attrs.id).toBe("templateContent");
          },
        }));

        injector = window.angular.bootstrap(ELEMENT, ["test1"]);

        injector.invoke(async ($templateCache) => {
          $templateCache.set(
            "my-directive.html",
            '<div id="templateContent">template content</div>',
          );
        });

        expect(ELEMENT.textContent).toEqual("");
        await wait();
        expect(ELEMENT.textContent).toEqual("template content");
      });
    });

    describe("scope", () => {
      let iscope, module;

      beforeEach(() => {
        log = [];

        window.angular = new Angular();
        module = window.angular
          .module("test1", ["ng"])
          .decorator("$exceptionHandler", () => {
            return (exception) => {
              log.push(exception.message);
            };
          });

        ["", "a", "b"].forEach((name) => {
          module
            .directive(`scope${name.toUpperCase()}`, () => ({
              scope: true,
              restrict: "A",
              compile() {
                return {
                  pre(scope) {
                    log.push(scope.$id);
                  },
                };
              },
            }))
            .directive(`iscope${name.toUpperCase()}`, () => ({
              scope: {},
              restrict: "A",
              compile() {
                return function (scope) {
                  iscope = scope;
                  log.push(scope.$id);
                };
              },
            }))
            .directive(`tscope${name.toUpperCase()}`, () => ({
              scope: true,
              restrict: "A",
              templateUrl: "tscope.html",
              compile() {
                return function (scope) {
                  log.push(scope.$id);
                };
              },
            }))
            .directive(`stscope${name.toUpperCase()}`, () => ({
              scope: true,
              restrict: "A",
              template: "<span></span>",
              compile() {
                return function (scope) {
                  log.push(scope.$id);
                };
              },
            }));
          module.directive(`trscope${name.toUpperCase()}`, () => ({
            scope: true,
            replace: true,
            restrict: "A",
            templateUrl: "trscope.html",
            compile() {
              return function (scope) {
                log.push(scope.$id);
              };
            },
          }));
          module.directive(`tiscope${name.toUpperCase()}`, () => ({
            scope: {},
            restrict: "A",
            templateUrl: "tiscope.html",
            compile() {
              return function (scope) {
                iscope = scope;
                log.push(scope.$id);
              };
            },
          }));
          module.directive(`stiscope${name.toUpperCase()}`, () => ({
            scope: {},
            restrict: "A",
            template: "<span></span>",
            compile() {
              return function (scope) {
                iscope = scope;
                log.push(scope.$id);
              };
            },
          }));
        });
        module.directive("log", () => ({
          restrict: "A",
          link: {
            pre(scope) {
              log.push(
                `log-${scope.$id}-${(scope.$parent && scope.$parent.$id) || "no-parent"}`,
              );
            },
          },
        }));
        module
          .directive("prototypeMethodNameAsScopeVarA", () => ({
            scope: {
              constructor: "=?",
              valueOf: "=",
            },
            restrict: "AE",
            template: "<span></span>",
          }))
          .directive("prototypeMethodNameAsScopeVarB", () => ({
            scope: {
              constructor: "@?",
              valueOf: "@",
            },
            restrict: "AE",
            template: "<span></span>",
          }))
          .directive("prototypeMethodNameAsScopeVarC", () => ({
            scope: {
              constructor: "&?",
              valueOf: "&",
            },
            restrict: "AE",
            template: "<span></span>",
          }))
          .directive("prototypeMethodNameAsScopeVarD", () => ({
            scope: {
              constructor: "<?",
              valueOf: "<",
            },
            restrict: "AE",
            template: "<span></span>",
          }))
          .directive("watchAsScopeVar", () => ({
            scope: {
              watch: "=",
            },
            restrict: "AE",
            template: "<span></span>",
          }));

        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );
      });

      it("should allow creation of new scopes", () => {
        element = $compile("<div><span scope><a log></a></span></div>")(
          $rootScope,
        );
        expect(log.length).toEqual(2);
      });

      it("should allow creation of new isolated scopes for directives", async () => {
        element = $compile("<div><span iscope><a log></a></span></div>")(
          $rootScope,
        );
        await wait();
        expect(log.length).toEqual(2);
        $rootScope.name = "abc";
        await wait();
        expect(iscope.$parent.$id).toBe($rootScope.$id);
        expect(iscope.name).toBeUndefined();
      });

      it("should allow creation of new scopes for directives with templates", async () => {
        $templateCache.set(
          "tscope.html",
          "<a log>{{name}}; scopeId: {{$id}}</a>",
        );
        element = $compile("<div><span tscope></span></div>")($rootScope);
        await wait();
        expect(log.length).toEqual(2);
        $rootScope.name = "Jozo";
        await wait();
        expect(element.textContent.match(/Jozo/)).toBeTruthy();
      });

      it("should allow creation of new scopes for replace directives with templates", async () => {
        $templateCache.set(
          "trscope.html",
          "<p><a log>{{name}}; scopeId: {{$id}}</a></p>",
        );
        element = $compile("<div><span trscope></span></div>")($rootScope);
        await wait();
        expect(log.length).toEqual(2);
        $rootScope.name = "Jozo";
        await wait();
        expect(element.textContent.match(/Jozo/)).toBeTruthy();
      });

      it("should allow creation of new scopes for replace directives with templates in a repeater", async () => {
        $templateCache.set("trscope.html", "<p><a log>{{name}}|</a></p>");
        element = $compile(
          '<div><span ng-repeat="i in [1,2,3]" trscope></span></div>',
        )($rootScope);
        await wait();
        expect(log.length).toEqual(6);
        $rootScope.name = "Jozo";
        await wait();
        expect(element.textContent).toBe("Jozo|Jozo|Jozo|");
      });

      it("should allow creation of new isolated scopes for directives with templates", async () => {
        $templateCache.set("tiscope.html", "<a log></a>");
        element = $compile("<div><span tiscope></span></div>")($rootScope);
        await wait();
        expect(log.length).toEqual(2);
        $rootScope.name = "abc";
        expect(iscope.$parent.$id).toBe($rootScope.$id);
        expect(iscope.name).toBeUndefined();
      });

      it("should correctly create the scope hierarchy", () => {
        element = $compile(
          "<div>" + // 1
            "<b scope>" + // 2
            "<b scope><b log></b></b>" + // 3
            "<b log></b>" +
            "</b>" +
            "<b scope>" + // 4
            "<b log></b>" +
            "</b>" +
            "</div>",
        )($rootScope);
        expect(log.length).toEqual(6);
      });

      it("should allow more than one new scope directives per element, but directives should share the scope", async () => {
        element = $compile("<div scope-a scope-b></div>")($rootScope);
        await wait();
        expect(log.length).toEqual(2);
      });

      it("should not allow more than one isolate scope creation per element", () => {
        expect(() => {
          $compile("<div iscope-a scope-b></div>")($rootScope);
        }).toThrowError(/multidir/);
      });

      it("should not allow more than one isolate/new scope creation per element regardless of `templateUrl`", async () => {
        $templateCache.set("tiscope.html", "<div>Hello, world !</div>");
        $compile("<div tiscope-a scope-b></div>")($rootScope);
        await wait();
        expect(log[0].match(/multidir/)).toBeTruthy();
      });

      it("should create new scope even at the root of the template", () => {
        element = $compile("<div scope-a></div>")($rootScope);
        expect(log.length).toEqual(1);
      });

      it("should create isolate scope even at the root of the template", () => {
        element = $compile("<div iscope></div>")($rootScope);
        expect(log.length).toEqual(1);
      });

      describe("scope()/isolate() scope getters", () => {
        describe("with new scope directives", () => {
          it("should return the new scope at the directive element", async () => {
            element = $compile("<div scope></div>")($rootScope);
            expect($rootScope.$children[0].$parent.$id).toBe($rootScope.$id);
          });

          it("should return the new scope for children in the original template", async () => {
            element = $compile("<div scope><a></a></div>")($rootScope);
            expect($rootScope.$children[0].$parent.$id).toBe($rootScope.$id);
          });

          it("should return the new scope for children in the directive template", () => {
            $templateCache.set("tscope.html", "<a></a>");
            element = $compile("<div tscope></div>")($rootScope);
            expect($rootScope.$children[0].$parent.$id).toBe($rootScope.$id);
          });

          it("should return the new scope for children in the directive sync template", async () => {
            element = $compile("<div stscope></div>")($rootScope);
            expect($rootScope.$children[0].$parent.$id).toBe($rootScope.$id);
          });
        });

        describe("with isolate scope directives", () => {
          it("should return the non-isolate scope at the directive element", async () => {
            expect($rootScope.$children).toEqual([]);
            $compile("<div><div iscope></div></div>")($rootScope);
            await wait();
            expect($rootScope.$children[0].$parent.$id).toBe($rootScope.$id);
          });

          it("should return the isolate scope for children in the original template", () => {
            element = $compile("<div iscope><a></a></div>")($rootScope);
            expect($rootScope.$children[0].$parent.$id).toBe($rootScope.$id); // xx
          });

          it("should return the isolate scope for children in directive template", async () => {
            $templateCache.set("tiscope.html", "<a></a>");
            element = $compile("<div tiscope></div>")($rootScope);
            await wait();
            expect($rootScope.$children[0]).toBeDefined(); // ??? this is the current behavior, not desired feature
            expect($rootScope.$children[0].$id).not.toBe($rootScope.$id);
          });

          it("should return the isolate scope for children in directive sync template", () => {
            element = $compile("<div stiscope></div>")($rootScope);
            expect($rootScope.$children[0]).not.toBe($rootScope);
          });

          it('should handle "=" bindings with same method names in Object.prototype correctly when not present', async () => {
            $compile("<div prototype-method-name-as-scope-var-a></div>")(
              $rootScope,
            );
            await wait();
            const scope = $rootScope.$children[0];
            expect(scope.$id).not.toBe($rootScope.$id);
            expect(scope.valueOf).toBeUndefined();
          });

          it('should handle "=" bindings with same method names in Object.prototype correctly when present', () => {
            $rootScope.constructor = "constructor";
            $rootScope.valueOf = "valueOf";
            const func = () => {
              element = $compile(
                '<div prototype-method-name-as-scope-var-a constructor="constructor" value-of="valueOf"></div>',
              )($rootScope);
            };

            expect(func).not.toThrow();
            const scope = $rootScope.$children[0];
            expect(scope).not.toBe($rootScope);
            expect(scope.constructor).toBe("constructor");
            expect(scope.valueOf).toBe("valueOf");
          });
        });

        it('should handle "@" bindings when not present', () => {
          const func = () => {
            element = $compile(
              "<div prototype-method-name-as-scope-var-b></div>",
            )($rootScope);
          };

          expect(func).not.toThrow();
          const scope = $rootScope.$children[0];
          expect(scope.$id).not.toBe($rootScope.$id);
        });

        it('should handle "@" bindings when present', () => {
          const func = () => {
            element = $compile(
              '<div prototype-method-name-as-scope-var-b constructor="constructor" value-of="valueOf"></div>',
            )($rootScope);
          };

          expect(func).not.toThrow();
          const scope = $rootScope.$children[0];
          expect(scope.$id).not.toBe($rootScope.$id);
        });

        it("should handle @ bindings on BOOLEAN attributes", async () => {
          let checkedVal;
          myModule.directive("test", () => ({
            scope: { checked: "@" },
            link(scope, element, attrs) {
              checkedVal = scope.checked;
            },
          }));
          injector = createInjector(["myModule"]);
          reloadInjector();
          $compile('<input test checked="checked">')($rootScope);
          await wait();
          expect(checkedVal).toEqual(true);
        });

        it("should handle updates to @ bindings on BOOLEAN attributes", async () => {
          let componentScope;
          myModule.directive("test", () => ({
            scope: { checked: "@" },
            link(scope, element, attrs) {
              componentScope = scope;
              attrs.$set("checked", true);
            },
          }));
          injector = createInjector(["myModule"]);
          reloadInjector();
          $compile("<test></test>")($rootScope);
          await wait();
          expect(componentScope.checked).toBe(true);
        });
      });

      //       describe("with isolate scope directives and directives that manually create a new scope", () => {
      //         it("should return the new scope at the directive element", () => {
      //           let directiveElement;
      //           element = $compile('<div><a ng-if="true" iscope></a></div>')(
      //             $rootScope,
      //           );
      //          await wait();
      //           directiveElement = element.querySelector("a");
      //           expect(directiveElement.scope().$parent).toBe($rootScope);
      //           expect(directiveElement.scope()).not.toBe(
      //             directiveElement.isolateScope(),
      //           );
      //         });

      //         it("should return the isolate scope for child elements", () => {
      //           let directiveElement;
      //           let child;
      //           $templateCache.set("tiscope.html", "<span></span>");
      //           element = $compile('<div><a ng-if="true" tiscope></a></div>')(
      //             $rootScope,
      //           );
      //          await wait();
      //           ;
      //           directiveElement = element.querySelector("a");
      //           child = directiveElement.querySelector("span");
      //           expect(child.scope()).toBe(directiveElement.isolateScope());
      //         });

      //         it("should return the isolate scope for child elements in directive sync template", () => {
      //           let directiveElement;
      //           let child;
      //           element = $compile('<div><a ng-if="true" stiscope></a></div>')(
      //             $rootScope,
      //           );
      //          await wait();
      //           directiveElement = element.querySelector("a");
      //           child = directiveElement.querySelector("span");
      //           expect(child.scope()).toBe(directiveElement.isolateScope());
      //         });
      //       });
      //     });

      //     describe("multidir isolated scope error messages", () => {
      //       angular
      //         .module("fakeIsoledScopeModule", [])
      //         .directive("fakeScope", () => ({
      //           scope: true,
      //           restrict: "A",
      //           compile() {
      //             return {
      //               pre(scope, element) {
      //                 log.push(scope.$id);
      //                 expect(getCacheData(element, "$scope")).toBe(scope);
      //               },
      //             };
      //           },
      //         }))
      //         .directive("fakeIScope", () => ({
      //           scope: {},
      //           restrict: "A",
      //           compile() {
      //             return function (scope, element) {
      //               iscope = scope;
      //               log.push(scope.$id);
      //               expect(getCacheData(element, "$isolateScopeNoTemplate")).toBe(scope);
      //             };
      //           },
      //         });

      //       beforeEach(
      //         module("fakeIsoledScopeModule", () => {
      //           directive("anonymModuleScopeDirective", () => ({
      //             scope: true,
      //             restrict: "A",
      //             compile() {
      //               return {
      //                 pre(scope, element) {
      //                   log.push(scope.$id);
      //                   expect(getCacheData(element, "$scope")).toBe(scope);
      //                 },
      //               };
      //             },
      //           });
      //         }),
      //       );

      //       it("should add module name to multidir isolated scope message if directive defined through module", () => {
      //         expect(() => {
      //           $compile('<div class="fake-scope; fake-i-scope"></div>');
      //         }).toThrowError(
      //           "$compile",
      //           "multidir",
      //           "Multiple directives [fakeIScope (module: fakeIsoledScopeModule), fakeScope (module: fakeIsoledScopeModule)] " +
      //             'asking for new/isolated scope on: <div class="fake-scope; fake-i-scope">',
      //         );
      //       });

      //       it("shouldn't add module name to multidir isolated scope message if directive is defined directly with $compileProvider", () => {
      //         expect(() => {
      //           $compile(
      //             '<div class="anonym-module-scope-directive; fake-i-scope"></div>',
      //           );
      //         }).toThrowError(
      //           "$compile",
      //           "multidir",
      //           "Multiple directives [anonymModuleScopeDirective, fakeIScope (module: fakeIsoledScopeModule)] " +
      //             'asking for new/isolated scope on: <div class="anonym-module-scope-directive; fake-i-scope">',
      //         );
      //       });
      //     });
    });

    describe("interpolation", () => {
      let observeSpy;
      let directiveAttrs;
      let deregisterObserver;
      let module;
      let $sce;

      beforeEach(() => {
        log = [];
        module = window.angular.module("test1", ["ng"]);
        module
          .directive(
            "observer",
            () =>
              function (scope, elm, attr) {
                directiveAttrs = attr;
                observeSpy = jasmine.createSpy("$observe attr");
                deregisterObserver = attr.$observe("someAttr", observeSpy);
              },
          )
          .directive("replaceSomeAttr", () => ({
            compile(element, attr) {
              attr.$set("someAttr", "bar-{{1+1}}");
              expect(element).toBe(attr.$$element);
            },
          }));
        dealoc(document.getElementById("app"));
        window.angular
          .bootstrap(document.getElementById("app"), ["test1"])
          .invoke((_$compile_, _$rootScope_, _$templateCache_, _$sce_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
            $sce = _$sce_;
          });
      });

      it("should compile and link both attribute and text bindings", async () => {
        $rootScope.name = "angular";
        element = $compile('<div name="attr: {{name}}">text: {{name}}</div>')(
          $rootScope,
        );
        await wait();
        expect(element.textContent).toEqual("text: angular");
        expect(element.getAttribute("name")).toEqual("attr: angular");
      });

      it("should interpolate a multi-part expression for regular attributes", async () => {
        element = $compile('<div foo="some/{{id}}"></div>')($rootScope);
        await wait();
        expect(element.getAttribute("foo")).toBe("some/");
        $rootScope.id = 1;
        await wait();
        expect(element.getAttribute("foo")).toEqual("some/1");
      });

      it("should process attribute interpolation in pre-linking phase at priority 100", async () => {
        module
          .directive("attrLog", () => ({
            compile($element, $attrs) {
              log.push(`compile=${$attrs.myName}`);

              return {
                pre($scope, $element, $attrs) {
                  log.push(`preLinkP0=${$attrs.myName}`);
                },
                post($scope, $element, $attrs) {
                  log.push(`postLink=${$attrs.myName}`);
                },
              };
            },
          }))
          .directive("attrLogHighPriority", () => ({
            priority: 101,
            compile() {
              return {
                pre($scope, $element, $attrs) {
                  log.push(`preLinkP101=${$attrs.myName}`);
                },
              };
            },
          }));

        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        element = $compile(
          '<div attr-log-high-priority attr-log my-name="{{name}}"></div>',
        )($rootScope);
        $rootScope.name = "angular";
        await wait();
        log.push(`digest=${element.getAttribute("my-name")}`);
        expect(log.join("; ")).toEqual(
          "compile={{name}}; preLinkP101={{name}}; preLinkP0=; postLink=; digest=angular",
        );
      });

      it("should allow the attribute to be removed before the attribute interpolation", async () => {
        module.directive("removeAttr", () => ({
          restrict: "A",
          compile(tElement, tAttr) {
            tAttr.$set("removeAttr", null);
          },
        }));

        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        expect(async () => {
          element = $compile('<div remove-attr="{{ toBeRemoved }}"></div>')(
            $rootScope,
          );
          await wait();
          expect(element.getAttribute("remove-attr")).toBeNull();
        }).not.toThrow();
      });

      describe("SCE values", () => {
        it("should resolve compile and link both attribute and text bindings", async () => {
          $rootScope.name = $sce.trustAsHtml("angular");
          element = $compile('<div name="attr: {{name}}">text: {{name}}</div>')(
            $rootScope,
          );
          await wait();
          expect(element.textContent).toEqual("text: angular");
          expect(element.getAttribute("name")).toEqual("attr: angular");
        });
      });

      it("should observe interpolated attrs", async () => {
        $compile('<div some-attr="{{value}}" observer></div>')($rootScope);

        // should be async
        expect(observeSpy).not.toHaveBeenCalled();
        $rootScope.value = "bound-value";
        await wait();
        expect(observeSpy).toHaveBeenCalledTimes(2);
        expect(observeSpy).toHaveBeenCalledWith("bound-value");
      });

      it("should return a deregistration function while observing an attribute", async () => {
        $compile('<div some-attr="{{value}}" observer></div>')($rootScope);

        $rootScope.$apply('value = "first-value"');
        await wait();
        expect(observeSpy).toHaveBeenCalledWith("first-value");

        deregisterObserver();
        $rootScope.$apply('value = "new-value"');
        await wait();
        expect(observeSpy).not.toHaveBeenCalledWith("new-value");
      });

      it("should set interpolated attrs to initial interpolation value", async () => {
        // we need the interpolated attributes to be initialized so that linking fn in a component
        // can access the value during link
        $rootScope.whatever = "test value";
        $compile('<div some-attr="{{whatever}}" observer></div>')($rootScope);
        await wait();
        expect(directiveAttrs.someAttr).toBe($rootScope.whatever);
      });

      it("should allow directive to replace interpolated attributes before attr interpolation compilation", async () => {
        element = $compile(
          '<div some-attr="foo-{{1+1}}" replace-some-attr></div>',
        )($rootScope);
        await wait();
        expect(element.getAttribute("some-attr")).toEqual("bar-2");
      });

      it("should call observer of non-interpolated attr through $evalAsync", async () => {
        $compile('<div some-attr="nonBound" observer></div>')($rootScope);

        expect(directiveAttrs.someAttr).toBe("nonBound");
        expect(observeSpy).toHaveBeenCalled();
      });

      it("should support non-interpolated `src` and `data-src` on the same element", async () => {
        const element = $compile('<img src="abc" data-src="123">')($rootScope);
        await wait();
        expect(element.getAttribute("src")).toEqual("abc");
        expect(element.getAttribute("data-src")).toEqual("123");
        expect(element.getAttribute("src")).toEqual("abc");
        expect(element.getAttribute("data-src")).toEqual("123");
      });

      it("should call observer only when the attribute value changes", async () => {
        module.directive("observingDirective", () => ({
          restrict: "E",
          scope: { someAttr: "@" },
        }));

        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );
        $compile("<observing-directive observer></observing-directive>")(
          $rootScope,
        );
        await wait();
        expect(observeSpy).not.toHaveBeenCalledWith(undefined);
      });

      it("should delegate exceptions to $exceptionHandler", async () => {
        observeSpy = jasmine.createSpy("$observe attr").and.throwError("ERROR");

        module.directive(
          "error",
          () =>
            function (scope, elm, attr) {
              attr.$observe("someAttr", observeSpy);
              attr.$observe("someAttr", observeSpy);
            },
        );

        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        $compile('<div some-attr="{{value}}" error></div>')($rootScope);
        await wait();
        expect(observeSpy).toHaveBeenCalled();
        expect(observeSpy).toHaveBeenCalledTimes(2);
      });

      it("should translate {{}} in terminal nodes", async () => {
        element = $compile(
          '<select ng-model="x"><option value="">Greet {{name}}!</option></select>',
        )($rootScope);
        await wait();
        expect(element.outerHTML).toEqual(
          '<select ng-model="x" class="ng-pristine ng-untouched ng-valid ng-empty" aria-invalid="false">' +
            '<option value="" selected="selected">Greet !</option>' +
            "</select>",
        );
        $rootScope.name = "Misko";
        await wait();
        expect(element.outerHTML).toEqual(
          '<select ng-model="x" class="ng-pristine ng-untouched ng-valid ng-empty" aria-invalid="false">' +
            '<option value="" selected="selected">Greet Misko!</option>' +
            "</select>",
        );
      });

      it("should handle consecutive text elements as a single text element", async () => {
        // Create and register the MutationObserver
        const observer = new window.MutationObserver(() => {});
        observer.observe(document.body, { childList: true, subtree: true });

        // Run the actual test
        const base = '<div>&mdash; {{ "This doesn\'t." }}</div>';
        element = $compile(base)($rootScope);
        await wait();
        expect(element.textContent).toBe("— This doesn't.");

        // Unregister the MutationObserver (and hope it doesn't mess up with subsequent tests)
        observer.disconnect();
      });

      it("should not process text nodes merged into their sibling", async () => {
        const div = document.createElement("div");
        div.appendChild(document.createTextNode("1{{ value }}"));
        div.appendChild(document.createTextNode("2{{ value }}"));
        div.appendChild(document.createTextNode("3{{ value }}"));

        element = div;
        $compile(element)($rootScope);
        $rootScope.$apply("value = 0");
        await wait();
        expect(element.textContent).toBe("102030");
        dealoc(div);
      });

      it("should support custom start/end interpolation symbols in template and directive template", async () => {
        createInjector([
          "test1",
          ($interpolateProvider, $compileProvider) => {
            $interpolateProvider.startSymbol = "##";
            $interpolateProvider.endSymbol = "]]";
            $compileProvider.directive("myDirective", () => ({
              template: "<span>{{hello}}|{{hello}}</span>",
            }));
          },
        ]).invoke((_$compile_, _$rootScope_, _$templateCache_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
          $templateCache = _$templateCache_;
        });

        element = $compile("<div>##hello]]|<div my-directive></div></div>")(
          $rootScope,
        );
        $rootScope.hello = "ahoj";
        await wait();
        expect(element.textContent).toBe("ahoj|ahoj|ahoj");
      });

      it("should support custom start interpolation symbol, even when `endSymbol` doesn't change", async () => {
        createInjector([
          "test1",
          ($interpolateProvider, $compileProvider) => {
            $interpolateProvider.startSymbol = "[[";
            $compileProvider.directive("myDirective", () => ({
              template: "<span>{{ hello }}|{{ hello}}</span>",
            }));
          },
        ]).invoke((_$compile_, _$rootScope_, _$templateCache_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
          $templateCache = _$templateCache_;
        });
        const tmpl = "<div>[[ hello }}|<div my-directive></div></div>";
        element = $compile(tmpl)($rootScope);

        $rootScope.hello = "ahoj";
        await wait();
        expect(element.textContent).toBe("ahoj|ahoj|ahoj");
      });

      it("should support custom end interpolation symbol, even when `startSymbol` doesn't change", async () => {
        createInjector([
          "test1",
          ($interpolateProvider, $compileProvider) => {
            $interpolateProvider.endSymbol = "]]";
            $compileProvider.directive("myDirective", () => ({
              template: "<span>{{ hello }}|{{ hello }}</span>",
            }));
          },
        ]).invoke((_$compile_, _$rootScope_, _$templateCache_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
          $templateCache = _$templateCache_;
        });

        const tmpl = "<div>{{ hello ]]|<div my-directive></div></div>";
        element = $compile(tmpl)($rootScope);

        $rootScope.hello = "ahoj";
        await wait();
        expect(element.textContent).toBe("ahoj|ahoj|ahoj");
      });

      it("should support custom start/end interpolation symbols in async directive template", async () => {
        createInjector([
          "test1",
          ($interpolateProvider, $compileProvider) => {
            $interpolateProvider.startSymbol = "##";
            $interpolateProvider.endSymbol = "]]";
            $compileProvider.directive("myDirective", () => ({
              templateUrl: "myDirective.html",
            }));
          },
        ]).invoke((_$compile_, _$rootScope_, _$templateCache_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
          $templateCache = _$templateCache_;
        });

        $templateCache.set(
          "myDirective.html",
          "<span>{{hello}}|{{hello}}</span>",
        );
        element = $compile("<div>##hello]]|<div my-directive></div></div>")(
          $rootScope,
        );
        $rootScope.hello = "ahoj";
        await wait();
        expect(element.textContent).toBe("ahoj|ahoj|ahoj");
      });

      it("should make attributes observable for terminal directives", async () => {
        module.directive("myAttr", () => ({
          terminal: true,
          link(scope, element, attrs) {
            attrs.$observe("myAttr", (val) => {
              log.push(val);
            });
          },
        }));
        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        element = $compile('<div my-attr="{{myVal}}"></div>')($rootScope);
        expect(log).toEqual([]);

        $rootScope.myVal = "carrot";
        await wait();
        expect(log[0]).toEqual("carrot");
      });
    });

    describe("link phase", () => {
      let module, log;
      beforeEach(() => {
        log = [];
        module = window.angular.module("test1", ["ng"]);
        ["a", "b", "c"].forEach((name) => {
          module.directive(name, () => ({
            compile() {
              log.push(`t${name.toUpperCase()}`);
              return {
                pre() {
                  log.push(`pre${name.toUpperCase()}`);
                },
                post: function linkFn() {
                  log.push(`post${name.toUpperCase()}`);
                },
              };
            },
          }));
        });

        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });
      });

      it("should compile from top to bottom but link from bottom up", async () => {
        element = $compile("<a b><c></c></a>")($rootScope);
        await wait();
        expect(log.join("; ")).toEqual(
          "tA; tB; tC; preA; preB; preC; postC; postB; postA",
        );
      });

      it("should support link function on directive object", async () => {
        module.directive("abc", () => ({
          link(scope, element, attrs) {
            element.innerText = attrs.abc;
          },
        }));

        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });
        element = $compile('<div abc="WORKS">FAIL</div>')($rootScope);
        await wait();
        expect(element.textContent).toEqual("WORKS");
      });

      it("should support $observe inside link function on directive object", async () => {
        module.directive("testLink", () => ({
          templateUrl: "test-link.html",
          link(scope, element, attrs) {
            attrs.$observe("testLink", (val) => {
              scope.testAttr = val;
            });
          },
        }));

        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        $templateCache.set("test-link.html", "{{testAttr}}");
        element = $compile('<div test-link="{{1+2}}"></div>')($rootScope);
        await wait();
        expect(element.textContent).toBe("3");
      });

      it("should throw multilink error when linking the same element more then once", async () => {
        const linker = $compile("<div>");
        await wait();
        linker($rootScope).remove();
        expect(() => {
          linker($rootScope);
        }).toThrowError(/multilink/);
      });

      describe("attrs", () => {
        it("should allow setting of attributes", async () => {
          module.directive({
            setter: () => (scope, element, attr) => {
              attr.$set("name", "abc");
              attr.$set("disabled", true);
              expect(attr.name).toBe("abc");
              expect(attr.disabled).toBe(true);
            },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile("<div setter></div>")($rootScope);
          await wait();
          expect(element.getAttribute("name")).toEqual("abc");
          expect(element.getAttribute("disabled")).toEqual("true");
        });

        it("should read boolean attributes as boolean only on control elements", async () => {
          let value;
          module.directive({
            input: () => ({
              link(scope, element, attr) {
                value = attr.required;
              },
            }),
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile("<input required></input>")($rootScope);
          await wait();
          expect(value).toEqual(true);
        });

        it("should read boolean attributes as text on non-control elements", async () => {
          let value;
          module.directive({
            div: () => ({
              link(scope, element, attr) {
                value = attr.required;
              },
            }),
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile('<div required="some text"></div>')($rootScope);
          await wait();
          expect(value).toEqual("some text");
        });

        it("should create new instance of attr for each template stamping", async () => {
          const state = { first: [], second: [] };
          module
            .value("state", state)
            .directive("first", () => ({
              priority: 1,
              compile(templateElement, templateAttr) {
                return function (scope, element, attr) {
                  state.first.push({
                    template: {
                      element: templateElement,
                      attr: templateAttr,
                    },
                    link: { element, attr },
                  });
                };
              },
            }))
            .directive("second", () => ({
              priority: 2,
              compile(templateElement, templateAttr) {
                return function (scope, element, attr) {
                  state.second.push({
                    template: {
                      element: templateElement,
                      attr: templateAttr,
                    },
                    link: { element, attr },
                  });
                };
              },
            }));

          createInjector(["test1"]).invoke(($rootScope, $compile, state) => {
            const template = $compile("<div first second>");
            dealoc(template($rootScope.$new(), () => {}));
            dealoc(template($rootScope.$new(), () => {}));

            // instance between directives should be shared
            expect(state.first[0].template.element).toBe(
              state.second[0].template.element,
            );
            expect(state.first[0].template.attr).toBe(
              state.second[0].template.attr,
            );

            // the template and the link can not be the same instance
            expect(state.first[0].template.element).not.toBe(
              state.first[0].link.element,
            );
            expect(state.first[0].template.attr).not.toBe(
              state.first[0].link.attr,
            );

            // each new template needs to be new instance
            expect(state.first[0].link.element).not.toBe(
              state.first[1].link.element,
            );
            expect(state.first[0].link.attr).not.toBe(state.first[1].link.attr);
            expect(state.second[0].link.element).not.toBe(
              state.second[1].link.element,
            );
            expect(state.second[0].link.attr).not.toBe(
              state.second[1].link.attr,
            );
          });
        });

        it("should properly $observe inside ng-repeat", async () => {
          const spies = [];

          module.directive(
            "observer",
            () =>
              function (scope, elm, attr) {
                spies.push(jasmine.createSpy(`observer ${spies.length}`));
                attr.$observe("some", spies[spies.length - 1]);
              },
          );

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile(
            '<div><div ng-repeat="i in items">' +
              '<span some="id_{{i.id}}" observer></span>' +
              "</div></div>",
          )($rootScope);

          await wait();
          $rootScope.items = [{ id: 1 }, { id: 2 }];

          await wait();
          expect(spies[0]).toHaveBeenCalledOnceWith("id_1");
          expect(spies[1]).toHaveBeenCalledOnceWith("id_2");
          spies[0].calls.reset();
          spies[1].calls.reset();

          $rootScope.items[0].id = 5;
          await wait();

          expect(spies[0]).toHaveBeenCalledOnceWith("id_5");
        });

        describe("$set", () => {
          let attr, $sce;
          beforeEach(async () => {
            ["input", "a", "img"].forEach((tag) => {
              module.directive(tag, () => ({
                link(scope, element, attr) {
                  scope.$target.attr = attr;
                },
              }));
            });

            createInjector(["test1"]).invoke(
              (_$compile_, _$rootScope_, _$sce_) => {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $sce = _$sce_;
              },
            );
            element = $compile("<input></input>")($rootScope);
            await wait();
            attr = $rootScope.attr;
            expect(attr).toBeDefined();
          });

          it("should set attributes", async () => {
            attr.$set("ngMyAttr", "value");
            expect(element.getAttribute("ng-my-attr")).toEqual("value");
            expect(attr.ngMyAttr).toEqual("value");
          });

          it("should allow overriding of attribute name and remember the name", () => {
            attr.$set("ngOther", "123", true, "other");
            expect(element.getAttribute("other")).toEqual("123");
            expect(attr.ngOther).toEqual("123");

            attr.$set("ngOther", "246");
            expect(element.getAttribute("other")).toEqual("246");
            expect(attr.ngOther).toEqual("246");
          });

          it("should remove attribute", () => {
            attr.$set("ngMyAttr", "value");
            expect(element.getAttribute("ng-my-attr")).toEqual("value");

            attr.$set("ngMyAttr", undefined);
            expect(element.getAttribute("ng-my-attr")).toBeNull();

            attr.$set("ngMyAttr", "value");
            attr.$set("ngMyAttr", null);
            expect(element.getAttribute("ng-my-attr")).toBeNull();
          });

          it("should set the value to empty for boolean attrs", () => {
            attr.$set("disabled", "value");
            expect(element.getAttribute("disabled")).toEqual("");
            element.removeAttribute("disabled");

            attr.$set("dISaBlEd", "VaLuE");
            expect(element.getAttribute("disabled")).toEqual("");
          });

          it("should call removeAttr for boolean attrs when value is `false`", () => {
            attr.$set("disabled", false);
            expect(element.getAttribute("disabled")).toBeNull();

            attr.$set("disabled", "value");
            expect(element.getAttribute("disabled")).toEqual("");

            attr.$set("dISaBlEd", false);
            expect(element.getAttribute("disabled")).toBeNull();
          });

          it("should not automatically sanitize a[href]", async () => {
            // Breaking change in https://github.com/angular/angular.js/pull/16378
            element = $compile("<a></a>")($rootScope);
            await wait();

            $rootScope.attr.$set("href", "evil:foo()");
            expect(element.getAttribute("href")).toEqual("evil:foo()");
            expect($rootScope.attr.href).toEqual("evil:foo()");
          });

          it("should not automatically sanitize img[src]", async () => {
            // Breaking change in https://github.com/angular/angular.js/pull/16378
            element = $compile("<img></img>")($rootScope);
            await wait();
            $rootScope.attr.$set("img", "evil:foo()");
            await wait();
            expect(element.getAttribute("img")).toEqual("evil:foo()");
            expect($rootScope.attr.img).toEqual("evil:foo()");
          });

          it("should automatically sanitize img[srcset]", async () => {
            element = $compile("<img></img>")($rootScope);
            $rootScope.attr.$set("srcset", "evil:foo()");
            await wait();
            expect(element.getAttribute("srcset")).toEqual("unsafe:evil:foo()");
            expect($rootScope.attr.srcset).toEqual("unsafe:evil:foo()");
          });

          it("should not accept trusted values for img[srcset]", async () => {
            const trusted = $sce.trustAsMediaUrl("trustme:foo()");
            element = $compile("<img></img>")($rootScope);
            await wait();
            expect(() => {
              $rootScope.attr.$set("srcset", trusted);
            }).toThrowError(/srcset/);
          });
        });
      });
    });

    describe("controller", () => {
      function TestController() {
        this.count = 0;
      }

      beforeEach(() => {
        log = [];
        module = window.angular.module("test1", ["ng"]);
        module
          .directive("d1", () => ({
            scope: true,

            controller: TestController,
          }))
          .directive("d2", () => ({
            scope: {},

            controller: TestController,
          }))
          .directive("d3", () => ({
            controller: TestController,
          }));

        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });
      });

      it("should set controller on element with inherited scope", async () => {
        element = $compile("<div d1></div>")($rootScope);
        await wait();
        expect(getController(element, "d1")).toBeDefined();

        element = $compile("<d1></d1>")($rootScope);
        expect(getController(element, "d1")).toBeDefined();
      });

      it("should set controller on element with isolate scope", async () => {
        element = $compile("<div d2></div>")($rootScope);
        await wait();
        expect(getController(element, "d2")).toBeDefined();

        element = $compile("<d2></d2>")($rootScope);
        expect(getController(element, "d2")).toBeDefined();
      });

      it("should set controller on element with parent scope", async () => {
        element = $compile("<div d3></div>")($rootScope);
        await wait();
        expect(getController(element, "d3")).toBeDefined();

        element = $compile("<d3></d3>")($rootScope);
        expect(getController(element, "d3")).toBeDefined();
      });
    });

    describe("controller lifecycle hooks", () => {
      let module, log;

      beforeEach(() => {
        log = [];
        module = window.angular.module("test1", ["ng"]);
      });

      describe("$onInit", () => {
        it("should call `$onInit`, if provided, after all the controllers on the element have been initialized", async () => {
          function check(args) {
            expect(getController(this.element, "d1").id).toEqual(1);
            expect(getController(this.element, "d2").id).toEqual(2);
          }

          function Controller1($element) {
            this.id = 1;
            this.element = $element;
          }
          Controller1.prototype.$onInit = jasmine
            .createSpy("$onInit")
            .and.callFake(check);

          function Controller2($element) {
            this.id = 2;
            this.element = $element;
          }
          Controller2.prototype.$onInit = jasmine
            .createSpy("$onInit")
            .and.callFake(check);

          module
            .directive("d1", () => ({ controller: Controller1 }))
            .directive("d2", () => ({ controller: Controller2 }));

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile("<div d1 d2></div>")($rootScope);
          await wait();

          expect(Controller1.prototype.$onInit).toHaveBeenCalled();
          expect(Controller2.prototype.$onInit).toHaveBeenCalled();
        });

        it("should continue to trigger other `$onInit` hooks if one throws an error", () => {
          function ThrowingController() {
            this.$onInit = function () {
              log.push("bad hook");
            };
          }
          function LoggingController() {
            this.$onInit = function () {
              log.push("onInit");
            };
          }

          module
            .component("c1", {
              controller: ThrowingController,
              bindings: { prop: "<" },
            })
            .component("c2", {
              controller: LoggingController,
              bindings: { prop: "<" },
            });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });
          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<div><c1 prop="a"></c1><c2 prop="a"></c2>')(
            $rootScope,
          );

          // The first component's error should be logged
          expect(log[0]).toEqual("bad hook");

          // The second component's hook should still be called
          expect(log[1]).toEqual("onInit");
        });
      });

      describe("$onDestroy", () => {
        it("should call `$onDestroy`, if provided, on the controller when its scope is destroyed", async () => {
          function TestController() {
            this.count = 0;
          }
          TestController.prototype.$onDestroy = function () {
            this.count++;
          };

          module
            .directive("d1", () => ({
              scope: true,
              controller: TestController,
            }))
            .directive("d2", () => ({
              scope: {},
              controller: TestController,
            }))
            .directive("d3", () => ({
              controller: TestController,
            }));

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });
          $rootScope.show = [true, true, true];
          element = $compile(
            '<div><d1 ng-if="show[0]"></d1><d2 ng-if="show[1]"></d2><div ng-if="show[2]"><d3></d3></div></div>',
          )($rootScope);
          await wait();
          $rootScope.show = [true, true, true];
          await wait();

          const d1Controller = getController(element.querySelector("d1"), "d1");
          const d2Controller = getController(element.querySelector("d2"), "d2");
          const d3Controller = getController(element.querySelector("d3"), "d3");

          expect([
            d1Controller.count,
            d2Controller.count,
            d3Controller.count,
          ]).toEqual([0, 0, 0]);
          $rootScope.$apply("show = [false, true, true]");
          await wait();
          expect([
            d1Controller.count,
            d2Controller.count,
            d3Controller.count,
          ]).toEqual([1, 0, 0]);
          $rootScope.$apply("show = [false, false, true]");
          await wait();
          expect([
            d1Controller.count,
            d2Controller.count,
            d3Controller.count,
          ]).toEqual([1, 1, 0]);
          $rootScope.$apply("show = [false, false, false]");
          await wait();
          expect([
            d1Controller.count,
            d2Controller.count,
            d3Controller.count,
          ]).toEqual([1, 1, 1]);
        });

        it("should call `$onDestroy` top-down (the same as `scope.$broadcast`)", async () => {
          let log = [];
          function ParentController() {
            log.push("parent created");
          }
          ParentController.prototype.$onDestroy = () => {
            log.push("parent destroyed");
          };
          function ChildController() {
            log.push("child created");
          }
          ChildController.prototype.$onDestroy = () => {
            log.push("child destroyed");
          };
          function GrandChildController() {
            log.push("grand child created");
          }
          GrandChildController.prototype.$onDestroy = () => {
            log.push("grand child destroyed");
          };

          module
            .directive("parent", () => ({
              scope: true,
              controller: ParentController,
            }))
            .directive("child", () => ({
              scope: true,
              controller: ChildController,
            }))
            .directive("grandChild", () => ({
              scope: true,
              controller: GrandChildController,
            }));

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile(
            '<parent ng-if="show"><child><grand-child></grand-child></child></parent>',
          )($rootScope);
          await wait();
          $rootScope.$apply("show = true");
          await wait();
          expect(log).toEqual([
            "parent created",
            "child created",
            "grand child created",
          ]);
          log = [];
          $rootScope.$apply("show = false");
          await wait();
          expect(log).toEqual([
            "parent destroyed",
            "child destroyed",
            "grand child destroyed",
          ]);
        });
      });

      describe("$postLink", () => {
        it("should call `$postLink`, if provided, after the element has completed linking (i.e. post-link)", async () => {
          const log = [];

          function Controller1() {}
          Controller1.prototype.$postLink = () => {
            log.push("d1 view init");
          };

          function Controller2() {}
          Controller2.prototype.$postLink = () => {
            log.push("d2 view init");
          };

          module
            .directive("d1", () => ({
              controller: Controller1,
              link: {
                pre(s, e) {
                  log.push(`d1 pre: ${e.innerText}`);
                },
                post(s, e) {
                  log.push(`d1 post: ${e.innerText}`);
                },
              },
              template: "<d2></d2>",
            }))
            .directive("d2", () => ({
              controller: Controller2,
              link: {
                pre(s, e) {
                  log.push(`d2 pre: ${e.innerText}`);
                },
                post(s, e) {
                  log.push(`d2 post: ${e.innerText}`);
                },
              },
              template: "loaded",
            }));

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });
          element = $compile("<d1></d1>")($rootScope);
          await wait();
          expect(log).toEqual([
            "d1 pre: loaded",
            "d2 pre: loaded",
            "d2 post: loaded",
            "d2 view init",
            "d1 post: loaded",
            "d1 view init",
          ]);
        });
      });

      describe("$onChanges", () => {
        it("should call `$onChanges`, if provided, when a one-way (`<`) or interpolation (`@`) bindings are updated", async () => {
          function TestController() {}
          TestController.prototype.$onChanges = function (change) {
            log.push(change);
          };

          module.component("c1", {
            controller: TestController,
            bindings: { prop1: "<", prop2: "<", other: "=", attr: "@" },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });
          // Setup a watch to indicate some complicated updated logic
          $rootScope.$watch("val", (val) => {
            $rootScope.val2 = val * 2;
          });
          // Setup the directive with two bindings
          element = $compile(
            '<c1 prop1="val" prop2="val2" other="val3" attr="{{val4}}"></c1>',
          )($rootScope);
          expect(log).toEqual([
            {
              prop1: jasmine.objectContaining({ currentValue: undefined }),
              prop2: jasmine.objectContaining({ currentValue: undefined }),
              attr: jasmine.objectContaining({ currentValue: "" }),
            },
          ]);
          await wait();
          // Clear the initial changes from the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply("val = 42");
          await wait();

          // Now we should have a double changes entry in the log
          expect(log[0]).toEqual({
            prop1: jasmine.objectContaining({ currentValue: 42 }),
          });
          expect(log[1]).toEqual({
            prop2: jasmine.objectContaining({ currentValue: 84 }),
          });

          // Clear the log
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply("val = 17");
          await wait();
          expect(log[0]).toEqual({
            prop1: jasmine.objectContaining({ currentValue: 17 }),
          });
          expect(log[1]).toEqual({
            prop2: jasmine.objectContaining({ currentValue: 34 }),
          });

          // Clear the log
          log = [];

          // Update val3 to trigger the "other" two-way binding
          $rootScope.$apply("val3 = 63");
          await wait();
          // onChanges should not have been called
          expect(log).toEqual([]);

          // Update val4 to trigger the "attr" interpolation binding
          $rootScope.$apply("val4 = 22");
          await wait();
          // onChanges should not have been called
          expect(log[0]).toEqual({
            attr: jasmine.objectContaining({ currentValue: "22" }),
          });
        });

        it("should trigger `$onChanges` even if the inner value already equals the new outer value", async () => {
          function TestController() {}
          TestController.prototype.$onChanges = function (change) {
            log.push(change);
          };

          module.component("c1", {
            controller: TestController,
            bindings: { prop1: "<" },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile('<c1 prop1="val"></c1>')($rootScope);
          await wait();
          log = [];
          $rootScope.$apply("val = 1");
          await wait();
          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: 1,
            }),
          });

          $rootScope.$children[0].$ctrl.prop1 = 2;
          $rootScope.$apply("val = 2");
          await wait();
          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: 2,
            }),
          });
        });

        it("should trigger `$onChanges` for literal expressions when expression input value changes (simple value)", async () => {
          function TestController() {}
          TestController.prototype.$onChanges = function (change) {
            log.push(change);
          };

          module.component("c1", {
            controller: TestController,
            bindings: { prop1: "<" },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile('<c1 prop1="[val]"></c1>')($rootScope);
          await wait();
          log = [];
          $rootScope.$apply("val = 1");
          await wait();

          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: [1],
            }),
          });

          $rootScope.$apply("val = 2");
          await wait();
          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: [2],
            }),
          });
        });

        it("should trigger `$onChanges` for literal expressions when expression input value changes (complex value)", async () => {
          function TestController() {}
          TestController.prototype.$onChanges = function (change) {
            log.push(change);
          };

          module.component("c1", {
            controller: TestController,
            bindings: { prop1: "<" },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile('<c1 prop1="[val]"></c1>')($rootScope);
          await wait();
          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: [undefined],
            }),
          });
          log = [];
          $rootScope.$apply("val = [1]");
          await wait();

          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: [[1]],
            }),
          });

          $rootScope.$apply("val = [2]");
          await wait();
          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: [[2]],
            }),
          });
        });

        it("should trigger `$onChanges` for literal expressions when expression input value changes instances, even when equal", async () => {
          function TestController() {}
          TestController.prototype.$onChanges = function (change) {
            log.push(change);
          };

          module.component("c1", {
            controller: TestController,
            bindings: { prop1: "<" },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          element = $compile('<c1 prop1="[val]"></c1>')($rootScope);
          await wait();
          $rootScope.$apply("val = [1]");
          await wait();
          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: [[1]],
            }),
          });

          $rootScope.$apply("val = [1]");
          await wait();
          expect(log.pop()).toEqual({
            prop1: jasmine.objectContaining({
              currentValue: [[1]],
            }),
          });
        });

        it("should trigger an initial onChanges call for each binding with the `isFirstChange()` returning true", async () => {
          function TestController() {}
          TestController.prototype.$onChanges = function (change) {
            log.push(change);
          };

          module.component("c1", {
            controller: TestController,
            bindings: { prop: "<", attr: "@" },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          $rootScope.$apply("a = 7");
          element = $compile('<c1 prop="a" attr="{{a}}"></c1>')($rootScope);
          await wait();

          expect(log[0]).toEqual({
            prop: jasmine.objectContaining({
              currentValue: 7,
              firstChange: true,
            }),
            attr: jasmine.objectContaining({
              currentValue: "7",
              firstChange: true,
            }),
          });

          log = [];
          $rootScope.$apply("a = 9");
          await wait();
          expect(log[0]).toEqual({
            prop: jasmine.objectContaining({
              currentValue: 9,
            }),
          });
          expect(log[1]).toEqual({
            attr: jasmine.objectContaining({
              currentValue: "9",
            }),
          });
        });

        it("should trigger an initial onChanges call for each binding even if the hook is defined in the constructor", async () => {
          function TestController() {
            this.$onChanges = function (change) {
              log.push(change);
            };
          }

          module.component("c1", {
            controller: TestController,
            bindings: { prop: "<", attr: "@" },
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          $rootScope.$apply("a = 7");
          element = $compile('<c1 prop="a" attr="{{a}}"></c1>')($rootScope);
          await wait();
          expect(log[0]).toEqual({
            prop: jasmine.objectContaining({ currentValue: 7 }),
            attr: jasmine.objectContaining({ currentValue: "7" }),
          });

          log = [];
          $rootScope.$apply("a = 10");
          await wait();
          expect(log[0]).toEqual({
            prop: jasmine.objectContaining({
              currentValue: 10,
            }),
          });

          expect(log[1]).toEqual({
            attr: jasmine.objectContaining({
              currentValue: "10",
            }),
          });
        });

        it("should clean up `@`-binding observers when re-assigning bindings", async () => {
          const constructorSpy = jasmine.createSpy("constructor");
          const prototypeSpy = jasmine.createSpy("prototype");

          function TestController() {
            return { $onChanges: constructorSpy };
          }
          TestController.prototype.$onChanges = prototypeSpy;

          module.component("test", {
            bindings: { attr: "@" },
            controller: TestController,
          });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          const template = '<test attr="{{a}}"></test>';
          $rootScope.a = "foo";

          element = $compile(template)($rootScope);
          await wait();
          expect(constructorSpy).toHaveBeenCalled();
          expect(prototypeSpy).not.toHaveBeenCalled();

          constructorSpy.calls.reset();
          $rootScope.$apply('a = "bar"');
          await wait();
          expect(constructorSpy).toHaveBeenCalled();
          expect(prototypeSpy).not.toHaveBeenCalled();
        });

        it("should only trigger one extra digest however many controllers have changes", async () => {
          let log = [];
          function TestController1() {}
          TestController1.prototype.$onChanges = function (change) {
            log.push(["TestController1", change]);
          };
          function TestController2() {}
          TestController2.prototype.$onChanges = function (change) {
            log.push(["TestController2", change]);
          };

          module
            .component("c1", {
              controller: TestController1,
              bindings: { prop: "<" },
            })
            .component("c2", {
              controller: TestController2,
              bindings: { prop: "<" },
            });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });

          // Setup two sibling components with bindings that will change
          element = $compile(
            '<div><c1 prop="val1"></c1><c2 prop="val2"></c2></div>',
          )($rootScope);

          // Clear out initial changes
          log = [];

          // Update val to trigger the onChanges
          $rootScope.$apply("val1 = 42; val2 = 17");
          await wait();
          expect(log).toEqual([
            [
              "TestController1",
              { prop: jasmine.objectContaining({ currentValue: 42 }) },
            ],
            [
              "TestController2",
              { prop: jasmine.objectContaining({ currentValue: 17 }) },
            ],
          ]);
        });

        it("should cope with changes occurring inside `$onChanges()` hooks", async () => {
          function OuterController() {}
          OuterController.prototype.$onChanges = function (change) {
            log.push(["OuterController", change]);
            // Make a change to the inner component
            this.b = this.prop1 * 2;
          };

          function InnerController() {}
          InnerController.prototype.$onChanges = function (change) {
            log.push(["InnerController", change]);
          };

          module
            .component("outer", {
              controller: OuterController,
              bindings: { prop1: "<" },
              template: '<inner prop2="$ctrl.b"></inner>',
            })
            .component("inner", {
              controller: InnerController,
              bindings: { prop2: "<" },
            });

          initInjector("test1");
          // Setup the directive with two bindings
          element = $compile('<outer prop1="a"></outer>')($rootScope);
          await wait();
          // Clear out initial changes
          log = [];

          // Update val to trigger the onChanges
          $rootScope.a = 42;
          await wait();
          expect(log).toEqual([
            [
              "OuterController",
              {
                prop1: jasmine.objectContaining({
                  currentValue: 42,
                }),
              },
            ],
            [
              "InnerController",
              {
                prop2: jasmine.objectContaining({
                  currentValue: 84,
                }),
              },
            ],
          ]);
        });

        it("should continue to trigger other `$onChanges` hooks if one throws an error", async () => {
          function ThrowingController() {
            this.$onChanges = function (change) {
              throw new Error("bad hook");
            };
          }
          function LoggingController($log) {
            this.$onChanges = function (change) {
              log.push("onChange");
            };
          }

          module
            .component("c1", {
              controller: ThrowingController,
              bindings: { prop: "<" },
            })
            .component("c2", {
              controller: LoggingController,
              bindings: { prop: "<" },
            })
            .decorator("$exceptionHandler", () => {
              return (exception) => {
                log.push(exception.message);
              };
            });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });
          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<div><c1 prop="a"></c1><c2 prop="a"></c2>')(
            $rootScope,
          );
          await wait();
          // The first component's error should be logged
          expect(log[0]).toEqual("bad hook");

          // The second component's changes should still be called
          expect(log[1]).toEqual("onChange");

          $rootScope.$apply("a = 42");

          await wait();
          // The first component's error should be logged
          expect(log[2]).toEqual("bad hook");

          // The second component's changes should still be called
          expect(log[3]).toEqual("onChange");
        });

        it("should throw `$onChanges` errors immediately", async () => {
          function ThrowingController() {
            this.$onChanges = function (change) {
              throw new Error(`bad hook: ${this.prop}`);
            };
          }

          module
            .component("c1", {
              controller: ThrowingController,
              bindings: { prop: "<" },
            })
            .decorator("$exceptionHandler", () => {
              return (exception) => {
                log.push(exception.message);
              };
            });

          createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
          });
          // Setup the directive with bindings that will keep updating the bound value forever
          element = $compile('<div><c1 prop="a"></c1><c1 prop="a * 2"></c1>')(
            $rootScope,
          );

          await wait();
          // Both component's errors should be logged
          expect(log[0]).toEqual("bad hook: undefined");
          expect(log[1]).toEqual("bad hook: NaN");

          $rootScope.$apply("a = 42");

          await wait();
          // // Both component's error should be logged individually
          expect(log[2]).toEqual("bad hook: 42");
          expect(log[3]).toEqual("bad hook: 84");
        });
      });
    });

    describe("isolated locals", () => {
      let componentScope;
      let regularScope;
      let module;
      let element;
      let error;

      beforeEach(() => {
        error = undefined;
        module = window.angular.module("test1", ["ng"]);
        module
          .decorator("$exceptionHandler", () => {
            return (exception, cause) => {
              error = exception.message;
            };
          })
          .directive("myComponent", () => ({
            scope: {
              attr: "@",
              attrAlias: "@attr",
              ref: "=",
              refAlias: "= ref",
              reference: "=",
              optref: "=?",
              optrefAlias: "=? optref",
              optreference: "=?",
              colref: "=",
              colrefAlias: "= colref",
              owRef: "<",
              owRefAlias: "< owRef",
              owOptref: "<?",
              owOptrefAlias: "<? owOptref",
              owColref: "<",
              owColrefAlias: "< owColref",
              expr: "&",
              optExpr: "&?",
              exprAlias: "&expr",
              constructor: "&?",
            },
            link(scope) {
              componentScope = scope;
            },
          }))
          .directive("parentComponent", () => ({
            scope: {},
            link(scope) {
              componentScope = scope;
            },
          }))
          .directive("badDeclaration", () => ({
            scope: { attr: "xxx" },
          }))
          .directive("storeScope", () => ({
            link(scope) {
              regularScope = scope;
            },
          }));

        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });
      });

      it("should give other directives the parent scope", async () => {
        element = $compile(
          '<div><input type="text" parent-component store-scope ng-model="value"></div>',
        )($rootScope);

        await wait();
        $rootScope.value = "from-parent";

        await wait();
        expect(element.querySelector("input").value).toBe("from-parent");
        expect(componentScope).not.toBe(regularScope);
        expect(componentScope.$parent.$id).toEqual(regularScope.$id);
      });

      it("should not give the isolate scope to other directive template", async () => {
        module.directive("otherTplDir", () => ({
          template: "value: {{value}}",
        }));
        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });

        element = $compile("<div my-component other-tpl-dir>")($rootScope);

        $rootScope.value = "from-parent";

        await wait();
        expect(element.innerHTML).toBe("value: from-parent");
      });

      it("should not give the isolate scope to other directive template (with templateUrl)", async () => {
        module.directive("otherTplDir", () => ({
          templateUrl: "other.html",
        }));

        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        $templateCache.set("other.html", "value: {{value}}");
        element = $compile("<div my-component other-tpl-dir>")($rootScope);
        $rootScope.value = "from-parent";

        await wait();
        expect(element.innerHTML).toBe("value: from-parent");
      });

      it("should not give the isolate scope to regular child elements", async () => {
        element = $compile("<div my-component>value: {{value}}</div>")(
          $rootScope,
        );

        $rootScope.value = "from-parent";

        await wait();
        expect(element.innerHTML).toBe("value: from-parent");
      });

      it('should update parent scope when "="-bound NaN changes', async () => {
        $rootScope.num = NaN;
        element = $compile('<div my-component reference="num"></div>')(
          $rootScope,
        );

        await wait();
        const isolateScope = $rootScope.$children[0];
        expect(isolateScope.reference).toBeNaN();
        isolateScope.reference = 64;

        await wait();
        expect($rootScope.num).toBe(64);
      });

      it('should update isolate scope when "="-bound NaN changes', async () => {
        $rootScope.num = NaN;
        element = $compile('<div my-component reference="num"></div>')(
          $rootScope,
        );

        await wait();
        const isolateScope = $rootScope.$children[0];
        expect(isolateScope.reference).toBeNaN();

        $rootScope.num = 64;

        await wait();
        expect(isolateScope.reference).toBe(64);
      });

      it("should be able to bind attribute names which are present in Object.prototype", async () => {
        module.directive("inProtoAttr", () => ({
          scope: {
            constructor: "@",
            toString: "&",
            watch: "=",
          },
        }));
        createInjector(["test1"]).invoke(
          (_$compile_, _$rootScope_, _$templateCache_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $templateCache = _$templateCache_;
          },
        );

        expect(async () => {
          element = $compile(
            '<div in-proto-attr constructor="hello, world" watch="[]" ' +
              'to-string="value = !value"></div>',
          )($rootScope);

          await wait();
        }).not.toThrow();
        const isolateScope = $rootScope.$children[0];

        expect(typeof isolateScope.constructor).toBe("string");
        expect(Array.isArray(isolateScope.watch)).toBe(true);
        expect(typeof isolateScope.toString).toBe("function");
        expect($rootScope.value).toBeUndefined();
        isolateScope.toString();
        expect($rootScope.value).toBe(true);
      });

      it("should be able to interpolate attribute names which are present in Object.prototype", async () => {
        let attrs;
        module.directive("attrExposer", () => ({
          link($scope, $element, $attrs) {
            attrs = $attrs;
          },
        }));

        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });

        $compile('<div attr-exposer to-string="{{1 + 1}}">')($rootScope);
        await wait();
        expect(attrs.toString).toBe("2");
      });

      it("should not initialize scope value if optional expression binding is not passed", async () => {
        element = $compile("<div my-component></div>")($rootScope);

        await wait();
        const isolateScope = $rootScope.$children[0];
        expect(isolateScope.optExpr).toBeUndefined();
      });

      it("should initialize scope value if optional expression binding is passed", async () => {
        element = $compile(
          "<div my-component opt-expr=\"value = 'did!'\"></div>",
        )($rootScope);

        await wait();
        const isolateScope = $rootScope.$children[0];
        expect(typeof isolateScope.optExpr).toBe("function");
        expect(isolateScope.optExpr()).toBe("did!");
        expect($rootScope.value).toBe("did!");
      });

      it("should initialize scope value if optional expression binding with Object.prototype name is passed", async () => {
        element = $compile(
          "<div my-component constructor=\"value = 'did!'\"></div>",
        )($rootScope);

        await wait();
        const isolateScope = $rootScope.$children[0];
        expect(typeof isolateScope.constructor).toBe("function");
        expect(isolateScope.constructor()).toBe("did!");
        expect($rootScope.value).toBe("did!");
      });

      it("should not overwrite @-bound property each digest when not present", async () => {
        module.directive("testDir", () => ({
          scope: { prop: "@" },
          controller($scope) {
            $scope.prop = $scope.prop || "default";
            this.getProp = () => {
              return $scope.prop;
            };
          },
          controllerAs: "ctrl",
          template: "<p></p>",
        }));

        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });

        element = $compile("<div test-dir></div>")($rootScope);

        await wait();
        const scope = $rootScope.$children[0];
        expect(scope.ctrl.getProp()).toBe("default");

        expect(scope.ctrl.getProp()).toBe("default");
      });

      it('should ignore optional "="-bound property if value is the empty string', async () => {
        module.directive("testDir", () => ({
          scope: { prop: "=?" },
          controller($scope) {
            $scope.prop = $scope.prop || "default";
            this.getProp = () => {
              return $scope.prop;
            };
          },
          controllerAs: "ctrl",
          template: "<p></p>",
        }));

        createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
          $compile = _$compile_;
          $rootScope = _$rootScope_;
        });

        element = $compile("<div test-dir></div>")($rootScope);

        await wait();
        const scope = $rootScope.$children[0];
        expect(scope.ctrl.getProp()).toBe("default");
        expect(scope.ctrl.getProp()).toBe("default");
        scope.prop = "foop";
        expect(scope.ctrl.getProp()).toBe("foop");
      });

      describe("bind-child-parent", () => {
        it("should continue with a sync cycle when there is a two-way binding from the child to the parent", async () => {
          module.directive("hello", () => ({
            restrict: "E",
            scope: { greeting: "=" },
            template: '<button ng-click="setGreeting()">Say hi!</button>',
            link(scope) {
              scope.setGreeting = () => {
                scope.greeting = "Hello!";
              };
            },
          }));

          createInjector(["test1"]).invoke(
            (_$compile_, _$rootScope_, _$templateCache_) => {
              $compile = _$compile_;
              $rootScope = _$rootScope_;
              $templateCache = _$templateCache_;
            },
          );

          element = $compile(
            "<div>" +
              "<p>{{greeting}}</p>" +
              '<div><hello greeting="greeting"></hello></div>' +
              "</div>",
          )($rootScope);

          await wait();
          element.querySelector("button").click();
          await wait();
          expect(element.querySelector("p").innerText).toBe("Hello!");
        });
      });

      describe("attribute", () => {
        it("should copy simple attribute", async () => {
          element = $compile('<div><span my-component attr="some text">')(
            $rootScope,
          );
          await wait();
          expect(componentScope.attr).toEqual("some text");
          expect(componentScope.attrAlias).toEqual("some text");
          expect(componentScope.attrAlias).toEqual(componentScope.attr);
        });

        it("should copy an attribute with spaces", async () => {
          element = $compile('<div><span my-component attr=" some text ">')(
            $rootScope,
          );

          await wait();
          expect(componentScope.attr).toEqual(" some text ");
          expect(componentScope.attrAlias).toEqual(" some text ");
          expect(componentScope.attrAlias).toEqual(componentScope.attr);
        });

        it("should set up the interpolation before it reaches the link function", async () => {
          $rootScope.name = "misko";
          $compile('<div><span my-component attr="hello {{name}}">')(
            $rootScope,
          );
          await wait();
          expect(componentScope.attr).toEqual("hello misko");
          expect(componentScope.attrAlias).toEqual("hello misko");
        });

        it("should update when interpolated attribute updates", async () => {
          $compile(
            '<div><span my-component attr="hello {{name}}" $attr$="hi {{name}}">',
          )($rootScope);

          $rootScope.name = "igor";
          await wait();

          expect(componentScope.attr).toEqual("hello igor");
          expect(componentScope.attrAlias).toEqual("hello igor");
        });
      });

      describe("object reference", () => {
        it("should update local when origin changes", async () => {
          $compile('<div><span my-component ref="name">')($rootScope);
          expect(componentScope.ref).toBeUndefined();
          expect(componentScope.refAlias).toBe(componentScope.ref);

          $rootScope.name = "misko";
          await wait();

          expect($rootScope.name).toBe("misko");
          expect(componentScope.ref).toBe("misko");
          expect(componentScope.refAlias).toBe("misko");
          $rootScope.name = {};
          await wait();
          expect(componentScope.ref).toEqual($rootScope.name);
          expect(componentScope.refAlias).toEqual($rootScope.name);
        });

        it("should update local when both change", async () => {
          $compile('<div><span my-component ref="name" $ref$="name">')(
            $rootScope,
          );
          $rootScope.name = { mark: 123 };
          componentScope.ref = "misko";

          await wait();
          expect($rootScope.name).toEqual({ mark: 123 });
          expect(componentScope.ref).toEqual($rootScope.name);
          expect(componentScope.refAlias).toEqual($rootScope.name);

          $rootScope.name = "igor";
          componentScope.ref = {};
          await wait();
          expect($rootScope.name).toEqual("igor");
          expect(componentScope.ref).toEqual($rootScope.name);
          expect(componentScope.refAlias).toEqual($rootScope.name);
        });

        it("should not break if local and origin both change to the same value", async () => {
          $rootScope.name = "aaa";

          $compile('<div><span my-component ref="name">')($rootScope);

          // change both sides to the same item within the same digest cycle
          componentScope.ref = "same";
          $rootScope.name = "same";
          await wait();

          // change origin back to its previous value
          $rootScope.name = "aaa";
          await wait();

          expect($rootScope.name).toBe("aaa");
          expect(componentScope.ref).toBe("aaa");
        });

        it("should complain on non assignable changes", async () => {
          $compile("<div><span my-component ref=\"'hello ' + name\">")(
            $rootScope,
          );
          $rootScope.name = "world";
          await wait();
          expect(componentScope.ref).toBe("hello world");

          componentScope.ref = "ignore me";
          await wait();
          expect(error).toMatch(/nonassign/);
          expect(componentScope.ref).toBe("hello world");

          $rootScope.name = "misko";
          await wait();
          expect(componentScope.ref).toBe("hello misko");
        });

        it("should complain if assigning to undefined", async () => {
          $compile("<div><span my-component></div>")($rootScope);
          await wait();
          expect(componentScope.ref).toBeUndefined();

          componentScope.ref = "ignore me";
          await wait();
          expect(error).toMatch(/nonassign/);
        });

        // regression
        it("should stabilize model", async () => {
          $compile('<div><span my-component reference="name">')($rootScope);

          let lastRefValueInParent;
          $rootScope.$watch("name", (ref) => {
            lastRefValueInParent = ref;
          });

          $rootScope.name = "aaa";
          await wait();
          expect(lastRefValueInParent).toBe("aaa");
          componentScope.reference = "new";
          await wait();
          expect(lastRefValueInParent).toBe("new");
        });

        describe("literal objects", () => {
          it("should copy parent changes", async () => {
            $compile('<div><span my-component reference="{name: name}">')(
              $rootScope,
            );
            await wait();
            $rootScope.name = "a";
            await wait();
            expect(componentScope.reference).toEqual({ name: "a" });

            $rootScope.name = "b";
            await wait();
            expect(componentScope.reference).toEqual({ name: "b" });
          });
          it("should not change the component when parent does not change", async () => {
            $compile('<div><span my-component reference="{name: name}">')(
              $rootScope,
            );

            $rootScope.name = "a";
            await wait();
            const lastComponentValue = componentScope.reference;
            await wait();
            expect(componentScope.reference).toBe(lastComponentValue);
          });

          it("should complain when the component changes", async () => {
            $compile('<div><span my-component reference="{name: name}">')(
              $rootScope,
            );

            $rootScope.name = "a";
            await wait();
            componentScope.reference = { name: "b" };

            await wait();
            expect(error).toMatch(/nonassign/);
          });

          it("should work for primitive literals", async () => {
            await test("1", 1);
            await test("null", null);
            await test("undefined", undefined);
            await test("'someString'", "someString");
            await test("true", true);

            async function test(literalString, literalValue) {
              $compile(`<div><span my-component reference="${literalString}">`)(
                $rootScope,
              );

              await wait();
              expect(componentScope.reference).toBe(literalValue);
            }

            expect().toBe();
          });
        });
      });

      describe("optional object reference", () => {
        it("should update local when origin changes", async () => {
          $compile('<div><span my-component optref="name">')($rootScope);
          expect(componentScope.optRef).toBeUndefined();
          expect(componentScope.optRefAlias).toEqual(componentScope.optRef);

          $rootScope.name = "misko";
          await wait();
          expect(componentScope.optref).toEqual($rootScope.name);
          expect(componentScope.optrefAlias).toEqual($rootScope.name);

          $rootScope.name = {};
          await wait();
          expect(componentScope.optref).toEqual($rootScope.name);
          expect(componentScope.optrefAlias).toEqual($rootScope.name);
        });

        it("should not throw exception when reference does not exist", async () => {
          $compile("<div><span my-component>")($rootScope);
          await wait();
          expect(componentScope.optref).toBeUndefined();
          expect(componentScope.optrefAlias).toBeUndefined();
          expect(componentScope.optreference).toBeUndefined();
        });
      });

      describe("collection object reference", () => {
        it("should update isolate scope when origin scope changes", async () => {
          $rootScope.collection = [
            {
              name: "Gabriel",
              value: 18,
            },
            {
              name: "Tony",
              value: 91,
            },
          ];
          $rootScope.query = "";
          await wait();

          $compile(
            '<div><span my-component colref="collection | filter:query" $colref$="collection | filter:query">',
          )($rootScope);
          await wait();
          expect(componentScope.colref).toEqual($rootScope.collection);
          expect(componentScope.colrefAlias).toEqual(componentScope.colref);

          $rootScope.query = "Gab";
          await wait();

          expect(componentScope.colref).toEqual([$rootScope.collection[0]]);
          expect(componentScope.colrefAlias).toEqual([
            $rootScope.collection[0],
          ]);
        });

        it("should update origin scope when isolate scope changes", async () => {
          $rootScope.collection = [
            {
              name: "Gabriel",
              value: 18,
            },
            {
              name: "Tony",
              value: 91,
            },
          ];

          $compile('<div><span my-component colref="collection">')($rootScope);

          const newItem = {
            name: "Pablo",
            value: 10,
          };
          componentScope.colref.push(newItem);
          await wait();

          expect($rootScope.collection[2]).toEqual(newItem);
        });
      });

      describe("one-way binding", () => {
        it("should update isolate when the identity of origin changes", async () => {
          $compile('<div><span my-component ow-ref="obj">')($rootScope);
          await wait();
          expect(componentScope.owRef).toBeUndefined();
          expect(componentScope.owRefAlias).toBe(componentScope.owRef);

          $rootScope.obj = { value: "initial" };
          await wait();

          expect($rootScope.obj).toEqual({ value: "initial" });
          expect(componentScope.owRef).toEqual({ value: "initial" });
          expect(componentScope.owRefAlias).toBe(componentScope.owRef);

          // This changes in both scopes because of reference
          $rootScope.obj.value = "origin1";
          await wait();
          expect(componentScope.owRef.value).toBe("origin1");
          expect(componentScope.owRefAlias.value).toBe("origin1");

          componentScope.owRef = { value: "isolate1" };
          componentScope.$apply();
          await wait();
          expect($rootScope.obj.value).toBe("origin1");

          // Change does propagate because object property changes
          $rootScope.obj.value = "origin2";
          await wait();
          expect(componentScope.owRef.value).toBe("origin2");
          expect(componentScope.owRefAlias.value).toBe("origin2");

          // Change does propagate because object identity changes
          $rootScope.obj = { value: "origin3" };
          await wait();
          expect(componentScope.owRef.value).toBe("origin3");
          expect(componentScope.owRef).toBe($rootScope.obj);
          expect(componentScope.owRefAlias).toBe($rootScope.obj);
        });

        it("should update isolate when both change", async () => {
          $compile('<div><span my-component ow-ref="name">')($rootScope);

          $rootScope.name = { mark: 123 };
          componentScope.owRef = "misko";

          await wait();
          expect($rootScope.name).toEqual({ mark: 123 });
          expect(componentScope.owRef).toBe($rootScope.name);
          expect(componentScope.owRefAlias).toBe($rootScope.name);

          $rootScope.name = "igor";
          componentScope.owRef = {};
          await wait();
          expect($rootScope.name).toEqual("igor");
          expect(componentScope.owRef).toBe($rootScope.name);
          expect(componentScope.owRefAlias).toBe($rootScope.name);
        });

        describe("initialization", () => {
          let component;

          beforeEach(() => {
            log = [];
            module.component("owComponent", {
              bindings: { input: "<" },
              controller() {
                component = this;
                this.input = "constructor";
                log.push("constructor");

                this.$onInit = () => {
                  this.input = "$onInit";
                  log.push("$onInit");
                };

                this.$onChanges = function (changes) {
                  if (changes.input) {
                    log.push([
                      "$onChanges",
                      changes.input.currentValue.$target[0],
                    ]);
                  }
                };
              },
            });

            module.directive(
              "changeInput",
              () =>
                function (scope, elem, attrs) {
                  scope.name = "outer2";
                },
            );

            createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
              $compile = _$compile_;
              $rootScope = _$rootScope_;
            });
          });

          it("should not update isolate again after $onInit", () => {
            $rootScope.name = "outer";
            $compile('<ow-component input="name"></ow-component>')($rootScope);

            expect($rootScope.name).toEqual("outer");
            expect(component.input).toEqual("$onInit");

            expect(log).toEqual(["constructor", "$onInit"]);
          });

          it("should update isolate again after $onInit if the object reference has changed", async () => {
            $rootScope.name = ["outer"];
            $compile('<ow-component input="name"></ow-component>')($rootScope);
            await wait();
            expect($rootScope.name).toEqual(["outer"]);
            expect(component.input).toEqual("$onInit");

            $rootScope.name[0] = "inner";
            await wait();
            expect($rootScope.name).toEqual(["inner"]);
            expect(component.input).toEqual(["inner"]);
            expect(log).toEqual([
              "constructor",
              ["$onChanges", "outer"],
              "$onInit",
              ["$onChanges", "inner"],
            ]);
          });

          it("should update isolate again after $onInit if outer object reference changes even if equal", async () => {
            $rootScope.name = ["outer"];
            $compile('<ow-component input="name"></ow-component>')($rootScope);
            await wait();
            expect($rootScope.name).toEqual(["outer"]);
            expect(component.input).toEqual("$onInit");

            $rootScope.name = ["outer"];
            await wait();
            expect($rootScope.name).toEqual(["outer"]);
            expect(component.input).toEqual(["outer"]);
            expect(log).toEqual([
              "constructor",
              ["$onChanges", "outer"],
              "$onInit",
              ["$onChanges", "outer"],
            ]);
          });

          it("should not update isolate again after $onInit if outer is a literal", async () => {
            $rootScope.name = "outer";
            $compile('<ow-component input="[name]"></ow-component>')(
              $rootScope,
            );

            expect(component.input).toEqual("$onInit");

            // Outer change
            $rootScope.$apply('name = "re-outer"');
            await wait();
            expect(component.input).toEqual(["re-outer"]);
            expect(log).toEqual(["constructor", "$onInit"]);
          });

          it("should update isolate again after $onInit if outer has changed (before initial watchAction call)", async () => {
            $rootScope.name = "outer1";
            $compile('<ow-component input="name"></ow-component>')($rootScope);

            expect(component.input).toEqual("$onInit");
            $rootScope.$apply('name = "outer2"');
            await wait();
            expect($rootScope.name).toEqual("outer2");
            expect(component.input).toEqual("outer2");
            expect(log).toEqual(["constructor", "$onInit"]);
          });

          it("should update isolate again after $onInit if outer has changed (before initial watchAction call)", async () => {
            $rootScope.name = "outer1";
            $compile('<ow-component input="name" change-input></ow-component>')(
              $rootScope,
            );
            expect(component.input).toEqual("$onInit");

            await wait();
            expect($rootScope.name).toEqual("outer2");
            expect(component.input).toEqual("outer2");
            expect(log).toEqual(["constructor", "$onInit"]);
          });

          it("should not break when isolate and origin both change to the same value", async () => {
            $rootScope.name = "aaa";
            $compile('<div><span my-component ow-ref="name">')($rootScope);

            // change both sides to the same item within the same digest cycle
            componentScope.owRef = "same";
            $rootScope.name = "same";
            await wait();

            // change origin back to its previous value
            $rootScope.name = "aaa";
            await wait();

            expect($rootScope.name).toBe("aaa");
            expect(componentScope.owRef).toBe("aaa");
          });

          it("should not update origin when identity of isolate changes", async () => {
            $rootScope.name = { mark: 123 };
            $compile('<div><span my-component ow-ref="name">')($rootScope);
            await wait();
            expect($rootScope.name).toEqual({ mark: 123 });
            expect(componentScope.owRef).toBe($rootScope.name);
            expect(componentScope.owRefAlias).toBe($rootScope.name);

            componentScope.owRef = "martin";
            await wait();
            expect($rootScope.name).toEqual({ mark: 123 });
            expect(componentScope.owRef).toBe("martin");
            expect(componentScope.owRefAlias).toEqual({ mark: 123 });
          });

          it("should update origin when property of isolate object reference changes", async () => {
            $rootScope.obj = { mark: 123 };
            $compile('<div><span my-component ow-ref="obj">')($rootScope);

            expect($rootScope.obj).toEqual({ mark: 123 });
            expect(componentScope.owRef).toBe($rootScope.obj);

            componentScope.owRef.mark = 789;
            await wait();
            expect($rootScope.obj).toEqual({ mark: 789 });
            expect(componentScope.owRef).toBe($rootScope.obj);
          });

          it("should not throw on non assignable expressions in the parent", async () => {
            $compile("<div><span my-component ow-ref=\"'hello ' + name\">")(
              $rootScope,
            );

            $rootScope.name = "world";
            await wait();
            expect(componentScope.owRef).toBe("hello world");

            componentScope.owRef = "ignore me";
            expect(componentScope.owRef).toBe("ignore me");
            expect($rootScope.name).toBe("world");

            $rootScope.name = "misko";
            await wait();
            expect(componentScope.owRef).toBe("hello misko");
          });

          it("should not throw when assigning to undefined", async () => {
            $compile("<div><span my-component>")($rootScope);

            expect(componentScope.owRef).toBeUndefined();

            componentScope.owRef = "ignore me";
            expect(componentScope.owRef).toBe("ignore me");

            await wait();
            expect(componentScope.owRef).toBe("ignore me");
          });

          it('should update isolate scope when "<"-bound NaN changes', async () => {
            $rootScope.num = NaN;
            element = $compile('<div my-component ow-ref="num"></div>')(
              $rootScope,
            );

            const isolateScope = $rootScope.$children[0];
            expect(isolateScope.owRef).toBeNaN();

            $rootScope.num = 64;
            await wait();
            expect(isolateScope.owRef).toBe(64);
          });
        });

        describe("literal objects", () => {
          it("should copy parent changes", async () => {
            $compile('<div><span my-component ow-ref="{name: name}">')(
              $rootScope,
            );

            $rootScope.name = "a";
            await wait();
            expect(componentScope.owRef).toEqual({ name: "a" });

            $rootScope.name = "b";
            await wait();
            expect(componentScope.owRef).toEqual({ name: "b" });
          });

          it("should not change the isolated scope when origin does not change", async () => {
            $compile('<div><span my-component ref="{name: name}">')($rootScope);

            $rootScope.name = "a";
            await wait();
            const lastComponentValue = componentScope.owRef;
            await wait();
            expect(componentScope.owRef).toBe(lastComponentValue);
          });

          it("should watch input values to array literals", async () => {
            $rootScope.name = "georgios";
            $rootScope.obj = { name: "pete" };
            $compile('<div><span my-component ow-ref="[{name: name}, obj]">')(
              $rootScope,
            );

            expect(componentScope.owRef).toEqual([
              { name: "georgios" },
              { name: "pete" },
            ]);

            $rootScope.name = "lucas";
            $rootScope.obj = { name: "martin" };
            await wait();
            expect(componentScope.owRef).toEqual([
              { name: "lucas" },
              { name: "martin" },
            ]);
          });

          it("should watch input values object literals", async () => {
            $rootScope.name = "georgios";
            $rootScope.obj = { name: "pete" };
            $compile(
              '<div><span my-component ow-ref="{name: name, item: obj}">',
            )($rootScope);

            expect(componentScope.owRef).toEqual({
              name: "georgios",
              item: { name: "pete" },
            });

            $rootScope.name = "lucas";
            $rootScope.obj = { name: "martin" };
            await wait();
            expect(componentScope.owRef).toEqual({
              name: "lucas",
              item: { name: "martin" },
            });
          });

          // https://github.com/angular/angular.js/issues/15833
          it("should work with ng-model inputs", async () => {
            let componentScope;

            module.directive("undi", () => ({
              restrict: "A",
              scope: {
                undi: "<",
              },
              link($scope) {
                componentScope = $scope;
              },
            }));

            createInjector(["test1"]).invoke((_$compile_, _$rootScope_) => {
              $compile = _$compile_;
              $rootScope = _$rootScope_;
            });

            element = $compile(
              '<form name="f" undi="[f.i]"><input name="i" ng-model="a"/></form>',
            )($rootScope);
            await wait();
            expect(componentScope.undi).toBeDefined();
          });

          it("should not complain when the isolated scope changes", async () => {
            $compile('<div><span my-component ow-ref="{name: name}">')(
              $rootScope,
            );

            $rootScope.name = "a";
            await wait();
            componentScope.owRef = { name: "b" };
            await wait();

            expect(componentScope.owRef).toEqual({ name: "b" });
            expect($rootScope.name).toBe("a");

            $rootScope.name = "c";
            await wait();
            expect(componentScope.owRef).toEqual({ name: "c" });
          });

          it("should work for primitive literals", async () => {
            await test("1", 1);
            await test("null", null);
            await test("undefined", undefined);
            await test("'someString'", "someString");
            await test("true", true);

            async function test(literalString, literalValue) {
              $compile(`<div><span my-component ow-ref="${literalString}">`)(
                $rootScope,
              );
              await wait();
              expect(componentScope.owRef).toBe(literalValue);
            }
          });

          describe("optional one-way binding", () => {
            it("should update local when origin changes", async () => {
              $compile(
                '<div><span my-component ow-optref="name" $ow-optref$="name">',
              )($rootScope);

              expect(componentScope.owOptref).toBeUndefined();
              expect(componentScope.owOptrefAlias).toBe(
                componentScope.owOptref,
              );
              expect(componentScope.$owOptrefAlias).toBe(
                componentScope.owOptref,
              );

              $rootScope.name = "misko";
              await wait();
              expect(componentScope.owOptref).toEqual($rootScope.name);
              expect(componentScope.owOptrefAlias).toEqual($rootScope.name);

              $rootScope.name = {};
              await wait();
              expect(componentScope.owOptref).toEqual($rootScope.name);
              expect(componentScope.owOptrefAlias).toEqual($rootScope.name);
            });

            it("should not throw exception when reference does not exist", async () => {
              $compile("<div><span my-component>")($rootScope);
              await wait();
              expect(componentScope.owOptref).toBeUndefined();
              expect(componentScope.owOptrefAlias).toBeUndefined();
            });
          });
        });
      });

      describe("one-way collection bindings", () => {
        it("should update isolate scope when origin scope changes", async () => {
          $rootScope.collection = [
            {
              name: "Gabriel",
              value: 18,
            },
            {
              name: "Tony",
              value: 91,
            },
          ];
          $rootScope.query = "";
          await wait();

          $compile(
            '<div><span my-component ow-colref="collection | filter:query" >',
          )($rootScope);
          await wait();
          expect(componentScope.owColref).toEqual($rootScope.collection);
          expect(componentScope.owColrefAlias).toEqual(componentScope.owColref);

          $rootScope.query = "Gab";
          await wait();

          expect(componentScope.owColref).toEqual([$rootScope.collection[0]]);
          expect(componentScope.owColrefAlias).toEqual([
            $rootScope.collection[0],
          ]);
        });

        it("should not update isolate scope when deep state within origin scope changes", async () => {
          $rootScope.collection = [
            {
              name: "Gabriel",
              value: 18,
            },
            {
              name: "Tony",
              value: 91,
            },
          ];
          await wait();

          $compile('<div><span my-component ow-colref="collection">')(
            $rootScope,
          );

          await wait();

          expect(componentScope.owColref).toBe($rootScope.collection);
          expect(componentScope.owColrefAlias).toBe(componentScope.owColref);

          componentScope.$target.owColref = undefined;
          componentScope.$target.owColrefAlias = undefined;

          $rootScope.collection[0].name = "Joe";
          await wait();

          expect(componentScope.owColref).toBeUndefined();
          expect(componentScope.owColrefAlias).toBeUndefined();
        });

        it("should update isolate scope when origin scope changes", async () => {
          $rootScope.gab = {
            name: "Gabriel",
            value: 18,
          };
          $rootScope.tony = {
            name: "Tony",
            value: 91,
          };
          $rootScope.query = "";
          await wait();

          $compile(
            '<div><span my-component ow-colref="[gab, tony] | filter:query">',
          )($rootScope);
          await wait();
          expect(componentScope.owColref).toEqual([
            $rootScope.gab,
            $rootScope.tony,
          ]);
          expect(componentScope.owColrefAlias).toEqual([
            $rootScope.gab,
            $rootScope.tony,
          ]);

          $rootScope.query = "Gab";
          await wait();

          expect(componentScope.owColref).toEqual([$rootScope.gab]);
          expect(componentScope.owColrefAlias).toEqual([$rootScope.gab]);
        });

        it("should update isolate scope when origin literal object content changes", async () => {
          $rootScope.gab = {
            name: "Gabriel",
            value: 18,
          };
          $rootScope.tony = {
            name: "Tony",
            value: 91,
          };
          await wait();

          $compile('<div><span my-component ow-colref="[gab, tony]">')(
            $rootScope,
          );
          await wait();
          expect(componentScope.owColref).toEqual([
            $rootScope.gab,
            $rootScope.tony,
          ]);
          expect(componentScope.owColrefAlias).toEqual([
            $rootScope.gab,
            $rootScope.tony,
          ]);

          $rootScope.tony = {
            name: "Bob",
            value: 42,
          };
          await wait();

          expect(componentScope.owColref).toEqual([
            $rootScope.gab,
            $rootScope.tony,
          ]);
          expect(componentScope.owColrefAlias).toEqual([
            $rootScope.gab,
            $rootScope.tony,
          ]);
        });
      });

      describe("executable expression", () => {
        it("should allow expression execution with locals", async () => {
          $compile('<div><span my-component expr="count = count + offset">')(
            $rootScope,
          );
          $rootScope.count = 2;
          await wait();

          expect(typeof componentScope.expr).toBe("function");
          expect(typeof componentScope.exprAlias).toBe("function");

          expect(componentScope.expr({ offset: 1 })).toEqual(3);
          expect($rootScope.count).toEqual(3);

          expect(componentScope.exprAlias({ offset: 10 })).toEqual(13);
          expect($rootScope.count).toEqual(13);
        });
      });

      it("should throw on unknown definition", () => {
        expect(() => {
          $compile("<div><span bad-declaration>");
        }).toThrowError(/iscp/);
      });

      it("should expose a $$isolateBindings property onto the scope", () => {
        $compile("<div><span my-component>")($rootScope);

        expect(typeof componentScope.$$isolateBindings).toBe("object");

        expect(componentScope.$$isolateBindings.attr.mode).toBe("@");
        expect(componentScope.$$isolateBindings.attr.attrName).toBe("attr");
        expect(componentScope.$$isolateBindings.attrAlias.attrName).toBe(
          "attr",
        );

        expect(componentScope.$$isolateBindings.ref.mode).toBe("=");
        expect(componentScope.$$isolateBindings.ref.attrName).toBe("ref");
        expect(componentScope.$$isolateBindings.refAlias.attrName).toBe("ref");
        expect(componentScope.$$isolateBindings.reference.mode).toBe("=");
        expect(componentScope.$$isolateBindings.reference.attrName).toBe(
          "reference",
        );
        expect(componentScope.$$isolateBindings.owRef.mode).toBe("<");
        expect(componentScope.$$isolateBindings.owRef.attrName).toBe("owRef");
        expect(componentScope.$$isolateBindings.owRefAlias.attrName).toBe(
          "owRef",
        );
        expect(componentScope.$$isolateBindings.expr.mode).toBe("&");
        expect(componentScope.$$isolateBindings.expr.attrName).toBe("expr");
        expect(componentScope.$$isolateBindings.exprAlias.attrName).toBe(
          "expr",
        );

        const firstComponentScope = componentScope;
        const first$$isolateBindings = componentScope.$$isolateBindings;

        dealoc(element);
        $compile("<div><span my-component>")($rootScope);
        expect(componentScope).not.toEqual(firstComponentScope);
        expect(componentScope.$$isolateBindings).toEqual(
          first$$isolateBindings,
        );
      });

      it("should expose isolate scope variables on controller with controllerAs when bindToController is true (template)", async () => {
        let controllerCalled = false;

        module.directive("fooDir", () => ({
          template: "<p>isolate</p>",
          scope: {
            data: "=dirData",
            oneway: "<dirData",
            str: "@dirStr",
            fn: "&dirFn",
          },
          controller($scope) {
            this.$onInit = () => {
              expect(this.data).toEqual({
                foo: "bar",
                baz: "biz",
              });
              expect(this.oneway).toEqual({
                foo: "bar",
                baz: "biz",
              });
              expect(this.str).toBe("Hello, world!");
              expect(this.fn()).toBe("called!");
            };
            controllerCalled = true;
          },
          controllerAs: "test",
          bindToController: true,
        }));

        initInjector("test1");

        $rootScope.fn = () => "called!";
        $rootScope.whom = "world";
        $rootScope.remoteData = {
          foo: "bar",
          baz: "biz",
        };
        element = $compile(
          '<div foo-dir dir-data="remoteData" ' +
            'dir-str="Hello, {{whom}}!" ' +
            'dir-fn="fn()"></div>',
        )($rootScope);
        await wait();
        expect(controllerCalled).toBe(true);
      });

      it("should not pre-assign bound properties to the controller", () => {
        let controllerCalled = false;
        let onInitCalled = false;
        module.directive("fooDir", () => ({
          template: "<p>isolate</p>",
          scope: {
            data: "=dirData",
            oneway: "<dirData",
            str: "@dirStr",
            fn: "&dirFn",
          },
          controller($scope) {
            expect(this.data).toBeUndefined();
            expect(this.oneway).toBeUndefined();
            expect(this.str).toBeUndefined();
            expect(this.fn).toBeUndefined();
            controllerCalled = true;
            this.$onInit = () => {
              expect(this.data).toEqual({
                foo: "bar",
                baz: "biz",
              });
              expect(this.oneway).toEqual({
                foo: "bar",
                baz: "biz",
              });
              expect(this.str).toBe("Hello, world!");
              expect(this.fn()).toBe("called!");
              onInitCalled = true;
            };
          },
          controllerAs: "test",
          bindToController: true,
        }));

        initInjector("test1");

        $rootScope.fn = () => "called!";
        $rootScope.whom = "world";
        $rootScope.remoteData = {
          foo: "bar",
          baz: "biz",
        };
        element = $compile(
          '<div foo-dir dir-data="remoteData" ' +
            'dir-str="Hello, {{whom}}!" ' +
            'dir-fn="fn()"></div>',
        )($rootScope);
        expect(controllerCalled).toBe(true);
        expect(onInitCalled).toBe(true);
      });

      it("should eventually expose isolate scope variables on ES6 class controller with controllerAs when bindToController is true", async () => {
        let controllerCalled = false;
        const Controller = eval(
          "(\n" +
            "class Foo {\n" +
            "  constructor($scope) {}\n" +
            "  $onInit() {\n" +
            "    expect(this.data).toEqual({\n" +
            "      'foo': 'bar',\n" +
            "      'baz': 'biz'\n" +
            "    });\n" +
            "    expect(this.oneway).toEqual({\n" +
            "      'foo': 'bar',\n" +
            "      'baz': 'biz'\n" +
            "    });\n" +
            "    expect(this.str).toBe('Hello, world!');\n" +
            "    expect(this.fn()).toBe('called!');\n" +
            "    controllerCalled = true;\n" +
            "  }\n" +
            "}\n" +
            ")",
        );
        spyOn(Controller.prototype, "$onInit").and.callThrough();

        module.directive("fooDir", () => ({
          template: "<p>isolate</p>",
          scope: {
            data: "=dirData",
            oneway: "<dirData",
            str: "@dirStr",
            fn: "&dirFn",
          },
          controller: Controller,
          controllerAs: "test",
          bindToController: true,
        }));
        initInjector("test1");
        $rootScope.fn = () => "called!";
        $rootScope.whom = "world";
        $rootScope.remoteData = {
          foo: "bar",
          baz: "biz",
        };
        element = $compile(
          '<div foo-dir dir-data="remoteData" ' +
            'dir-str="Hello, {{whom}}!" ' +
            'dir-fn="fn()"></div>',
        )($rootScope);
        expect(Controller.prototype.$onInit).toHaveBeenCalled();
        expect(controllerCalled).toBe(true);
      });

      it("should update @-bindings on controller when bindToController and attribute change observed", async () => {
        module.directive("atBinding", () => ({
          template: "<p>{{At.text}}</p>",
          scope: {
            text: "@atBinding",
          },
          controller($scope) {},
          bindToController: true,
          controllerAs: "At",
        }));
        initInjector("test1");
        element = $compile('<div at-binding="Test: {{text}}"></div>')(
          $rootScope,
        );
        await wait();
        const p = element.querySelector("p");
        expect(p.innerText).toBe("Test: ");

        $rootScope.text = "Kittens";

        await wait();
        expect(p.innerText).toBe("Test: Kittens");
      });

      it("should expose isolate scope variables on controller with controllerAs when bindToController is true (templateUrl)", async () => {
        let controllerCalled = false;
        module.directive("fooDir", () => ({
          templateUrl: "test.html",
          scope: {
            data: "=dirData",
            oneway: "<dirData",
            str: "@dirStr",
            fn: "&dirFn",
          },
          controller($scope) {
            this.$onInit = () => {
              expect(this.data).toEqual({
                foo: "bar",
                baz: "biz",
              });
              expect(this.oneway).toEqual({
                foo: "bar",
                baz: "biz",
              });
              expect(this.str).toBe("Hello, world!");
              expect(this.fn()).toBe("called!");
            };
            controllerCalled = true;
          },
          controllerAs: "test",
          bindToController: true,
        }));
        initInjector("test1");

        $templateCache.set("test.html", "<p>isolate</p>");
        $rootScope.fn = () => "called!";
        $rootScope.whom = "world";
        $rootScope.remoteData = {
          foo: "bar",
          baz: "biz",
        };
        element = $compile(
          '<div foo-dir dir-data="remoteData" ' +
            'dir-str="Hello, {{whom}}!" ' +
            'dir-fn="fn()"></div>',
        )($rootScope);

        await wait();
        expect(controllerCalled).toBe(true);
      });

      it("should throw noctrl when missing controller", () => {
        module.directive("noCtrl", () => ({
          templateUrl: "test.html",
          scope: {
            data: "=dirData",
            oneway: "<dirData",
            str: "@dirStr",
            fn: "&dirFn",
          },
          controllerAs: "test",
          bindToController: true,
        }));
        initInjector("test1");
        expect(() => {
          $compile("<div no-ctrl>")($rootScope);
        }).toThrowError(/noctrl/);
      });

      it("should throw badrestrict on first compilation when restrict is invalid", async () => {
        module
          .directive("invalidRestrictBadString", () => ({ restrict: '"' }))
          .directive("invalidRestrictTrue", () => ({ restrict: true }))
          .directive("invalidRestrictObject", () => ({ restrict: {} }))
          .directive("invalidRestrictNumber", () => ({ restrict: 42 }))
          .decorator("$exceptionHandler", () => {
            return (exception, cause) => {
              log.push(exception.message);
            };
          });

        initInjector("test1");
        $compile("<div invalid-restrict-true>")($rootScope);
        await wait();
        expect(log.length).toBe(1);
        expect(log[0]).toMatch(/\$compile.*badrestrict.*'true'/);

        $compile("<div invalid-restrict-bad-string>")($rootScope);
        $compile("<div invalid-restrict-bad-string>")($rootScope);
        await wait();
        expect(log.length).toBe(2);
        expect(log[1]).toMatch(/\$compile.*badrestrict.*'"'/);

        $compile("<div invalid-restrict-bad-string invalid-restrict-object>")(
          $rootScope,
        );
        await wait();
        expect(log.length).toBe(3);
        expect(log[2]).toMatch(/\$compile.*badrestrict.*'{}'/);

        $compile("<div invalid-restrict-object invalid-restrict-number>")(
          $rootScope,
        );
        await wait();
        expect(log.length).toBe(4);
        expect(log[3]).toMatch(/\$compile.*badrestrict.*'42'/);
      });

      describe("should bind to controller via object notation", () => {
        const controllerOptions = [
          {
            description: "no controller identifier",
            controller: "myCtrl",
          },
          {
            description: '"Ctrl as ident" syntax',
            controller: "myCtrl as myCtrl",
          },
          {
            description: "controllerAs setting",
            controller: "myCtrl",
            controllerAs: "myCtrl",
          },
        ];

        const scopeOptions = [
          {
            description: "isolate scope",
            scope: {},
          },
          {
            description: "new scope",
            scope: true,
          },
          {
            description: "no scope",
            scope: false,
          },
        ];

        const templateOptions = [
          {
            description: "inline template",
            template: "<p>template</p>",
          },
          {
            description: "templateUrl setting",
            templateUrl: "test.html",
          },
          {
            description: "no template",
          },
        ];

        controllerOptions.forEach((controllerOption) => {
          Object.values(scopeOptions).forEach((scopeOption) => {
            Object.values(templateOptions).forEach((templateOption) => {
              const description = [];
              const ddo = {
                bindToController: {
                  data: "=dirData",
                  oneway: "<dirData",
                  str: "@dirStr",
                  fn: "&dirFn",
                },
              };

              [controllerOption, scopeOption, templateOption].forEach(
                (option) => {
                  description.push(option.description);
                  delete option.description;
                  extend(ddo, option);
                },
              );

              it(`(${description.join(", ")})`, async () => {
                let controllerCalled = false;
                myModule
                  .controller("myCtrl", function () {
                    this.$onInit = function () {
                      expect(this.$target.data).toEqual({
                        foo: "bar",
                        baz: "biz",
                      });
                      expect(this.$target.oneway).toEqual({
                        foo: "bar",
                        baz: "biz",
                      });
                      expect(this.$target.str).toBe("Hello, world!");
                      expect(this.$target.fn()).toBe("called!");
                    };
                    controllerCalled = true;
                  })
                  .directive("fooDir", () => ddo);

                initInjector("myModule");

                $templateCache.set("test.html", "<p>template</p>");
                $rootScope.fn = () => "called!";
                $rootScope.whom = "world";
                $rootScope.remoteData = {
                  foo: "bar",
                  baz: "biz",
                };
                element = $compile(
                  '<div foo-dir dir-data="remoteData" ' +
                    'dir-str="Hello, {{whom}}!" ' +
                    'dir-fn="fn()"></div>',
                )($rootScope);
                await wait();
                expect(controllerCalled).toBe(true);
                if (ddo.controllerAs || ddo.controller.indexOf(" as ") !== -1) {
                  if (ddo.scope) {
                    expect($rootScope.myCtrl).toBeUndefined();
                  } else {
                    // The controller identifier was added to the containing scope.
                    expect($rootScope.myCtrl).toBeDefined();
                  }
                }
              });
            });
          });
        });
      });

      it("should bind to multiple directives controllers via object notation (no scope)", async () => {
        let controller1Called = false;
        let controller2Called = false;
        module
          .directive("foo", () => ({
            bindToController: {
              data: "=fooData",
              oneway: "<fooData",
              str: "@fooStr",
              fn: "&fooFn",
            },
            controllerAs: "fooCtrl",
            controller() {
              this.$onInit = () => {
                expect(this.data).toEqual({ foo: "bar", baz: "biz" });
                expect(this.oneway).toEqual({ foo: "bar", baz: "biz" });
                expect(this.str).toBe("Hello, world!");
                expect(this.fn()).toBe("called!");
              };
              controller1Called = true;
            },
          }))
          .directive("bar", () => ({
            bindToController: {
              data: "=barData",
              oneway: "<barData",
              str: "@barStr",
              fn: "&barFn",
            },
            controllerAs: "barCtrl",
            controller() {
              this.$onInit = () => {
                expect(this.data).toEqual({ foo2: "bar2", baz2: "biz2" });
                expect(this.oneway).toEqual({ foo2: "bar2", baz2: "biz2" });
                expect(this.str).toBe("Hello, second world!");
                expect(this.fn()).toBe("second called!");
              };
              controller2Called = true;
            },
          }));
        initInjector("test1");
        $rootScope.fn = () => "called!";
        $rootScope.string = "world";
        $rootScope.data = { foo: "bar", baz: "biz" };
        $rootScope.fn2 = () => "second called!";
        $rootScope.string2 = "second world";
        $rootScope.data2 = { foo2: "bar2", baz2: "biz2" };
        element = $compile(
          "<div " +
            "foo " +
            'foo-data="data" ' +
            'foo-str="Hello, {{string}}!" ' +
            'foo-fn="fn()" ' +
            "bar " +
            'bar-data="data2" ' +
            'bar-str="Hello, {{string2}}!" ' +
            'bar-fn="fn2()" > ' +
            "</div>",
        )($rootScope);
        await wait();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });

      it("should bind to multiple directives controllers via object notation (new iso scope)", async () => {
        let controller1Called = false;
        let controller2Called = false;
        module
          .directive("foo", () => ({
            bindToController: {
              data: "=fooData",
              oneway: "<fooData",
              str: "@fooStr",
              fn: "&fooFn",
            },
            scope: {},
            controllerAs: "fooCtrl",
            controller() {
              this.$onInit = () => {
                expect(this.data).toEqual({ foo: "bar", baz: "biz" });
                expect(this.oneway).toEqual({ foo: "bar", baz: "biz" });
                expect(this.str).toBe("Hello, world!");
                expect(this.fn()).toBe("called!");
              };
              controller1Called = true;
            },
          }))
          .directive("bar", () => ({
            bindToController: {
              data: "=barData",
              oneway: "<barData",
              str: "@barStr",
              fn: "&barFn",
            },
            controllerAs: "barCtrl",
            controller() {
              this.$onInit = () => {
                expect(this.data).toEqual({ foo2: "bar2", baz2: "biz2" });
                expect(this.oneway).toEqual({ foo2: "bar2", baz2: "biz2" });
                expect(this.str).toBe("Hello, second world!");
                expect(this.fn()).toBe("second called!");
              };
              controller2Called = true;
            },
          }));
        initInjector("test1");
        $rootScope.fn = () => "called!";
        $rootScope.string = "world";
        $rootScope.data = { foo: "bar", baz: "biz" };
        $rootScope.fn2 = () => "second called!";
        $rootScope.string2 = "second world";
        $rootScope.data2 = { foo2: "bar2", baz2: "biz2" };
        element = $compile(
          "<div " +
            "foo " +
            'foo-data="data" ' +
            'foo-str="Hello, {{string}}!" ' +
            'foo-fn="fn()" ' +
            "bar " +
            'bar-data="data2" ' +
            'bar-str="Hello, {{string2}}!" ' +
            'bar-fn="fn2()" > ' +
            "</div>",
        )($rootScope);
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });

      it("should bind to multiple directives controllers via object notation (new scope)", async () => {
        let controller1Called = false;
        let controller2Called = false;
        module
          .directive("foo", () => ({
            bindToController: {
              data: "=fooData",
              oneway: "<fooData",
              str: "@fooStr",
              fn: "&fooFn",
            },
            scope: true,
            controllerAs: "fooCtrl",
            controller() {
              this.$onInit = () => {
                // UNDEFINED BEHAVIOR IN JASMINE? unless using $target this test overwrites scope.$target!
                expect(this.$target.data).toEqual({ foo: "bar", baz: "biz" });
                expect(this.$target.oneway).toEqual({ foo: "bar", baz: "biz" });
                expect(this.$target.str).toBe("Hello, world!");
                expect(this.$target.fn()).toBe("called!");
              };
              controller1Called = true;
            },
          }))
          .directive("bar", () => ({
            bindToController: {
              data: "=barData",
              oneway: "<barData",
              str: "@barStr",
              fn: "&barFn",
            },
            scope: true,
            controllerAs: "barCtrl",
            controller() {
              this.$onInit = function () {
                expect(this.$target.data).toEqual({
                  foo2: "bar2",
                  baz2: "biz2",
                });
                expect(this.$target.oneway).toEqual({
                  foo2: "bar2",
                  baz2: "biz2",
                });
                expect(this.$target.str).toBe("Hello, second world!");
                expect(this.fn()).toBe("second called!");
              };
              controller2Called = true;
            },
          }));
        initInjector("test1");
        $rootScope.fn = () => "called!";
        $rootScope.string = "world";
        $rootScope.data = { foo: "bar", baz: "biz" };
        $rootScope.fn2 = () => "second called!";
        $rootScope.string2 = "second world";
        $rootScope.data2 = { foo2: "bar2", baz2: "biz2" };
        element = $compile(
          "<div " +
            "foo " +
            'foo-data="data" ' +
            'foo-str="Hello, {{string}}!" ' +
            'foo-fn="fn()" ' +
            "bar " +
            'bar-data="data2" ' +
            'bar-str="Hello, {{string2}}!" ' +
            'bar-fn="fn2()" > ' +
            "</div>",
        )($rootScope);
        await wait();
        expect(controller1Called).toBe(true);
        expect(controller2Called).toBe(true);
      });

      it("should evaluate against the correct scope, when using `bindToController` (new scope)", async () => {
        module
          .controller("ParentCtrl", function () {
            this.value1 = "parent1";
            this.value2 = "parent2";
            this.value3 = () => {
              return "parent3";
            };
            this.value4 = "parent4";
          })
          .controller("ChildCtrl", function () {
            this.value1 = "child1";
            this.value2 = "child2";
            this.value3 = () => {
              return "child3";
            };
            this.value4 = "child4";
          })
          .directive("child", () => ({
            scope: true,
            controller: "ChildCtrl as ctrl1",
            bindToController: {
              fromParent1: "@",
              fromParent2: "=",
              fromParent3: "&",
              fromParent4: "<",
            },
            template: "",
          }));
        initInjector("test1");
        element = $compile(
          '<div ng-controller="ParentCtrl as ctrl">' +
            "<child " +
            'from-parent-1="{{ ctrl.value1 }}" ' +
            'from-parent-2="ctrl.value2" ' +
            'from-parent-3="ctrl.value3" ' +
            'from-parent-4="ctrl.value4">' +
            "</child>" +
            "</div>",
        )($rootScope);
        await wait();
        const parentCtrl = getController(element, "ngController");
        assert(parentCtrl);
        const childCtrl = getController(
          element.querySelector("child"),
          "child",
        );
        assert(childCtrl);

        expect(childCtrl.fromParent1).toBe(parentCtrl.value1);
        expect(childCtrl.fromParent1).not.toBe(childCtrl.value1);
        expect(childCtrl.fromParent2).toBe(parentCtrl.value2);
        expect(childCtrl.fromParent2).not.toBe(childCtrl.value2);
        expect(childCtrl.fromParent3()()).toBe(parentCtrl.value3());
        expect(childCtrl.fromParent3()()).not.toBe(childCtrl.value3());
        expect(childCtrl.fromParent4).toBe(parentCtrl.value4);
        expect(childCtrl.fromParent4).not.toBe(childCtrl.value4);
        childCtrl.fromParent2 = "modified";
        await wait();
        expect(parentCtrl.value2).toBe("modified");
        expect(childCtrl.value2).toBe("child2");
      });

      it("should evaluate against the correct scope, when using `bindToController` (new iso scope)", async () => {
        module
          .controller("ParentCtrl", function () {
            this.value1 = "parent1";
            this.value2 = "parent2";
            this.value3 = () => {
              return "parent3";
            };
            this.value4 = "parent4";
          })
          .controller("ChildCtrl", function () {
            this.value1 = "child1";
            this.value2 = "child2";
            this.value3 = () => {
              return "child3";
            };
            this.value4 = "child4";
          })
          .directive("child", () => ({
            scope: {},
            controller: "ChildCtrl as ctrl",
            bindToController: {
              fromParent1: "@",
              fromParent2: "=",
              fromParent3: "&",
              fromParent4: "<",
            },
            template: "",
          }));

        initInjector("test1");
        element = $compile(
          '<div ng-controller="ParentCtrl as ctrl">' +
            "<child " +
            'from-parent-1="{{ ctrl.value1 }}" ' +
            'from-parent-2="ctrl.value2" ' +
            'from-parent-3="ctrl.value3" ' +
            'from-parent-4="ctrl.value4">' +
            "</child>" +
            "</div>",
        )($rootScope);
        await wait();
        const parentCtrl = getController(element, "ngController");
        const childCtrl = getController(
          element.querySelector("child"),
          "child",
        );

        expect(childCtrl.fromParent1).toBe(parentCtrl.value1);
        expect(childCtrl.fromParent1).not.toBe(childCtrl.value1);
        expect(childCtrl.fromParent2).toBe(parentCtrl.value2);
        expect(childCtrl.fromParent2).not.toBe(childCtrl.value2);
        expect(childCtrl.fromParent3()()).toBe(parentCtrl.value3());
        expect(childCtrl.fromParent3()()).not.toBe(childCtrl.value3());
        expect(childCtrl.fromParent4).toBe(parentCtrl.value4);
        expect(childCtrl.fromParent4).not.toBe(childCtrl.value4);

        childCtrl.fromParent2 = "modified";
        await wait();
        expect(parentCtrl.value2).toBe("modified");
        expect(childCtrl.value2).toBe("child2");
      });

      it("should put controller in scope when controller identifier present but not using controllerAs", async () => {
        let controllerCalled = false;
        let myCtrl;
        module
          .controller("myCtrl", function () {
            controllerCalled = true;
            myCtrl = this;
          })
          .directive("fooDir", () => ({
            templateUrl: "test.html",
            bindToController: {},
            scope: true,
            controller: "myCtrl as theCtrl",
          }));
        initInjector("test1");
        $templateCache.set("test.html", "<p>isolate</p>");
        element = $compile("<div foo-dir>")($rootScope);
        await wait();
        expect(controllerCalled).toBe(true);
        const childScope = $rootScope.$children[0];
        expect(childScope).not.toEqual($rootScope);
        expect(childScope.theCtrl).toEqual(myCtrl);
      });

      it("should re-install controllerAs and bindings for returned value from controller (new scope)", async () => {
        let controllerCalled = false;
        let myCtrl;

        function MyCtrl() {}
        MyCtrl.prototype.test = function () {
          expect(this.data.foo).toEqual("bar");
          expect(this.data.baz).toEqual("biz");

          expect(this.oneway.foo).toEqual("bar");
          expect(this.oneway.baz).toEqual("biz");
          expect(this.str).toBe("Hello, world!");
          expect(this.fn()).toBe("called!");
        };

        module
          .controller("myCtrl", function () {
            controllerCalled = true;
            myCtrl = this;
            return new MyCtrl();
          })
          .directive("fooDir", () => ({
            templateUrl: "test.html",
            bindToController: {
              data: "=dirData",
              oneway: "<dirData",
              str: "@dirStr",
              fn: "&dirFn",
            },
            scope: true,
            controller: "myCtrl as theCtrl",
          }));
        initInjector("test1");
        $templateCache.set("test.html", "<p>isolate</p>");
        $rootScope.fn = () => "called!";
        $rootScope.whom = "world";
        $rootScope.remoteData = {
          foo: "bar",
          baz: "biz",
        };
        element = $compile(
          '<div foo-dir dir-data="remoteData" ' +
            'dir-str="Hello, {{whom}}!" ' +
            'dir-fn="fn()"></div>',
        )($rootScope);
        await wait();
        expect(controllerCalled).toBe(true);
        const childScope = $rootScope.$children[0];
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).not.toBe(myCtrl);
        expect(childScope.theCtrl.constructor).toBe(MyCtrl);
        childScope.theCtrl.test();
      });

      it("should re-install controllerAs and bindings for returned value from controller (isolate scope)", async () => {
        let controllerCalled = false;
        let myCtrl;

        function MyCtrl() {}
        MyCtrl.prototype.test = function () {
          expect(this.data).toEqual({
            foo: "bar",
            baz: "biz",
          });
          expect(this.oneway).toEqual({
            foo: "bar",
            baz: "biz",
          });
          expect(this.str).toBe("Hello, world!");
          expect(this.fn()).toBe("called!");
        };

        module
          .controller("myCtrl", () => {
            controllerCalled = true;
            myCtrl = this;
            return new MyCtrl();
          })
          .directive("fooDir", () => ({
            templateUrl: "test.html",
            bindToController: true,
            scope: {
              data: "=dirData",
              oneway: "<dirData",
              str: "@dirStr",
              fn: "&dirFn",
            },
            controller: "myCtrl as theCtrl",
          }));
        initInjector("test1");
        $templateCache.set("test.html", "<p>isolate</p>");
        $rootScope.fn = () => "called!";
        $rootScope.whom = "world";
        $rootScope.remoteData = {
          foo: "bar",
          baz: "biz",
        };
        element = $compile(
          '<div foo-dir dir-data="remoteData" ' +
            'dir-str="Hello, {{whom}}!" ' +
            'dir-fn="fn()"></div>',
        )($rootScope);
        await wait();
        expect(controllerCalled).toBe(true);
        const childScope = $rootScope.$children[0];
        expect(childScope).not.toBe($rootScope);
        expect(childScope.theCtrl).not.toBe(myCtrl);
        expect(childScope.theCtrl.constructor).toBe(MyCtrl);
        childScope.theCtrl.test();
      });

      describe("should not overwrite @-bound property each digest when not present", () => {
        it("when creating new scope", () => {
          module.directive("testDir", () => ({
            scope: true,
            bindToController: {
              prop: "@",
            },
            controller() {
              const self = this;
              this.$onInit = () => {
                this.prop = this.prop || "default";
              };
              this.getProp = () => {
                return self.prop;
              };
            },
            controllerAs: "ctrl",
            template: "<p></p>",
          }));
          initInjector("test1");
          element = $compile("<div test-dir></div>")($rootScope);
          const scope = $rootScope.$children[0];
          expect(scope.ctrl.getProp()).toBe("default");

          expect(scope.ctrl.getProp()).toBe("default");
        });

        it("when creating isolate scope", () => {
          module.directive("testDir", () => ({
            scope: {},
            bindToController: {
              prop: "@",
            },
            controller() {
              const self = this;
              this.$onInit = () => {
                this.prop = this.prop || "default";
              };
              this.getProp = () => {
                return self.prop;
              };
            },
            controllerAs: "ctrl",
            template: "<p></p>",
          }));
          initInjector("test1");
          element = $compile("<div test-dir></div>")($rootScope);
          const scope = $rootScope.$children[0];
          expect(scope.ctrl.getProp()).toBe("default");

          expect(scope.ctrl.getProp()).toBe("default");
        });
      });
    });

    describe("require", () => {
      let module;

      beforeEach(() => {
        module = window.angular.module("test1", ["ng"]);
      });

      it("should get required controller", () => {
        module
          .directive("main", () => ({
            priority: 2,
            controller() {
              this.name = "main";
            },
            link(scope, element, attrs, controller) {
              log.push(controller.name);
            },
          }))
          .directive("dep", () => ({
            priority: 1,
            require: "main",
            link(scope, element, attrs, controller) {
              log.push(`dep:${controller.name}`);
            },
          }))
          .directive("other", () => ({
            link(scope, element, attrs, controller) {
              log.push(!!controller); // should be false
            },
          }));
        initInjector("test1");
        element = $compile("<div main dep other></div>")($rootScope);
        expect(log.join("; ")).toEqual("false; dep:main; main");
      });

      it("should respect explicit return value from controller", () => {
        let expectedController;
        module.directive("logControllerProp", () => ({
          controller($scope) {
            this.foo = "baz"; // value should not be used.
            expectedController = { foo: "bar" };
            return expectedController;
          },
          link(scope, element, attrs, controller) {
            expect(expectedController).toBeDefined();
            expect(controller).toEqual(expectedController);
            expect(controller.foo).toBe("bar");
            log.push("done");
          },
        }));
        initInjector("test1");
        element = $compile("<log-controller-prop></log-controller-prop>")(
          $rootScope,
        );
        expect(log[0]).toEqual("done");
        expect(getCacheData(element, "$logControllerPropController")).toEqual(
          expectedController,
        );
      });

      it("should get explicit return value of required parent controller", async () => {
        let expectedController;
        module.directive("nested", () => ({
          require: "^^?nested",
          controller() {
            if (!expectedController) expectedController = { foo: "bar" };
            return expectedController;
          },
          link(scope, element, attrs, controller) {
            if (element.parentElement) {
              expect(expectedController).toBeDefined();
              expect(controller).toEqual(expectedController);
              expect(controller.foo).toEqual("bar");
              log.push("done");
            }
          },
        }));
        initInjector("test1");
        element = $compile("<div nested><div nested></div></div>")($rootScope);
        await wait();
        expect(log[0]).toEqual("done");
        expect(getCacheData(element, "$nestedController")).toEqual(
          expectedController,
        );
      });

      it("should respect explicit controller return value when using controllerAs", async () => {
        module.directive("main", () => ({
          templateUrl: "main.html",
          scope: {},
          controller() {
            this.name = "lucas";
            return { name: "george" };
          },
          controllerAs: "mainCtrl",
        }));
        initInjector("test1");
        $templateCache.set(
          "main.html",
          "<span>template:{{mainCtrl.name}}</span>",
        );
        element = $compile("<main/>")($rootScope);
        await wait();
        expect(element.textContent).toBe("template:george");
      });

      it("transcluded children should receive explicit return value of parent controller", async () => {
        let expectedController;
        module
          .directive("nester", () => ({
            transclude: true,
            controller($transclude) {
              this.foo = "baz";
              expectedController = { transclude: $transclude, foo: "bar" };
              return expectedController;
            },
            link(scope, el, attr, ctrl) {
              ctrl.transclude(cloneAttach);
              function cloneAttach(clone) {
                el.append(clone);
              }
            },
          }))
          .directive("nested", () => ({
            require: "^^nester",
            link(scope, element, attrs, controller) {
              expect(controller).toBeDefined();
              expect(controller).toEqual(expectedController);
              log.push("done");
            },
          }));
        initInjector("test1");
        element = $compile("<div nester><div nested></div></div>")($rootScope);
        await wait();
        expect(log.toString()).toBe("done");
        expect(getCacheData(element, "$nesterController")).toEqual(
          expectedController,
        );
      });

      it("explicit controller return values are ignored if they are primitives", () => {
        module.directive("logControllerProp", () => ({
          controller($scope) {
            this.foo = "baz"; // value *will* be used.
            return "bar";
          },
          link(scope, element, attrs, controller) {
            log.push(controller.foo);
          },
        }));
        initInjector("test1");
        element = $compile("<log-controller-prop></log-controller-prop>")(
          $rootScope,
        );
        expect(log[0]).toEqual("baz");
        expect(
          getCacheData(element, "$logControllerPropController").foo,
        ).toEqual("baz");
      });

      it("should correctly assign controller return values for multiple directives", () => {
        let directiveController;
        let otherDirectiveController;
        module
          .directive("myDirective", () => ({
            scope: true,
            controller($scope) {
              directiveController = {
                foo: "bar",
              };
              return directiveController;
            },
          }))
          .directive("myOtherDirective", () => ({
            controller($scope) {
              otherDirectiveController = {
                baz: "luh",
              };
              return otherDirectiveController;
            },
          }));
        initInjector("test1");
        element = $compile("<my-directive my-other-directive></my-directive>")(
          $rootScope,
        );
        expect(getCacheData(element, "$myDirectiveController")).toEqual(
          directiveController,
        );
        expect(getCacheData(element, "$myOtherDirectiveController")).toEqual(
          otherDirectiveController,
        );
      });

      it("should get required parent controller", () => {
        module.directive("nested", () => ({
          require: "^^?nested",
          controller($scope) {},
          link(scope, element, attrs, controller) {
            log.push(!!controller);
          },
        }));
        initInjector("test1");
        element = $compile("<div nested><div nested></div></div>")($rootScope);
        expect(log.join("; ")).toEqual("true; false");
      });

      it("should get required parent controller when the question mark precedes the ^^", () => {
        module.directive("nested", () => ({
          require: "?^^nested",
          controller($scope) {},
          link(scope, element, attrs, controller) {
            log.push(!!controller);
          },
        }));
        initInjector("test1");
        element = $compile("<div nested><div nested></div></div>")($rootScope);
        expect(log.join("; ")).toEqual("true; false");
      });

      it("should throw if required parent is not found", () => {
        module.directive("nested", () => ({
          require: "^^nested",
          controller($scope) {},
          link(scope, element, attrs, controller) {},
        }));
        initInjector("test1");
        expect(() => {
          element = $compile("<div nested></div>")($rootScope);
        }).toThrowError(/ctreq/);
      });

      it("should get required controller via linkingFn (template)", async () => {
        module
          .directive("dirA", () => ({
            controller() {
              this.name = "dirA";
            },
          }))
          .directive("dirB", () => ({
            require: "dirA",
            template: "<p>dirB</p>",
            link(scope, element, attrs, dirAController) {
              log.push(`dirAController.name: ${dirAController.name}`);
            },
          }));
        initInjector("test1");
        element = $compile("<div dir-a dir-b></div>")($rootScope);
        await wait();
        expect(log[0]).toEqual("dirAController.name: dirA");
      });

      it("should get required controller via linkingFn (templateUrl)", async () => {
        module
          .directive("dirA", () => ({
            controller() {
              this.name = "dirA";
            },
          }))
          .directive("dirB", () => ({
            require: "dirA",
            templateUrl: "dirB.html",
            link(scope, element, attrs, dirAController) {
              log.push(`dirAController.name: ${dirAController.name}`);
            },
          }));
        initInjector("test1");
        $templateCache.set("dirB.html", "<p>dirB</p>");
        element = $compile("<div dir-a dir-b></div>")($rootScope);
        await wait();
        expect(log[0]).toEqual("dirAController.name: dirA");
      });

      it("should bind the required controllers to the directive controller, if provided as an object and bindToController is truthy", () => {
        let parentController;
        let siblingController;

        function ParentController() {
          this.name = "Parent";
        }
        function SiblingController() {
          this.name = "Sibling";
        }
        function MeController() {
          this.name = "Me";
        }
        MeController.prototype.$onInit = function () {
          parentController = this.container;
          siblingController = this.friend;
        };
        spyOn(MeController.prototype, "$onInit").and.callThrough();

        module
          .directive("me", () => ({
            restrict: "E",
            scope: {},
            require: { container: "^parent", friend: "sibling" },
            bindToController: true,
            controller: MeController,
            controllerAs: "$ctrl",
          }))
          .directive("parent", () => ({
            restrict: "E",
            scope: {},
            controller: ParentController,
          }))
          .directive("sibling", () => ({
            controller: SiblingController,
          }));
        initInjector("test1");
        element = $compile("<parent><me sibling></me></parent>")($rootScope);
        expect(MeController.prototype.$onInit).toHaveBeenCalled();
        expect(parentController).toEqual(jasmine.any(ParentController));
        expect(siblingController).toEqual(jasmine.any(SiblingController));
      });

      it("should use the key if the name of a required controller is omitted", async () => {
        function ParentController() {
          this.name = "Parent";
        }
        function ParentOptController() {
          this.name = "ParentOpt";
        }
        function ParentOrSiblingController() {
          this.name = "ParentOrSibling";
        }
        function ParentOrSiblingOptController() {
          this.name = "ParentOrSiblingOpt";
        }
        function SiblingController() {
          this.name = "Sibling";
        }
        function SiblingOptController() {
          this.name = "SiblingOpt";
        }

        module
          .component("me", {
            require: {
              parent: "^^",
              parentOpt: "?^^",
              parentOrSibling1: "^",
              parentOrSiblingOpt1: "?^",
              parentOrSibling2: "^",
              parentOrSiblingOpt2: "?^",
              sibling: "",
              siblingOpt: "?",
            },
          })
          .directive("parent", () => ({ controller: ParentController }))
          .directive("parentOpt", () => ({ controller: ParentOptController }))
          .directive("parentOrSibling1", () => ({
            controller: ParentOrSiblingController,
          }))
          .directive("parentOrSiblingOpt1", () => ({
            controller: ParentOrSiblingOptController,
          }))
          .directive("parentOrSibling2", () => ({
            controller: ParentOrSiblingController,
          }))
          .directive("parentOrSiblingOpt2", () => ({
            controller: ParentOrSiblingOptController,
          }))
          .directive("sibling", () => ({ controller: SiblingController }))
          .directive("siblingOpt", () => ({
            controller: SiblingOptController,
          }));
        initInjector("test1");
        const template =
          "<div>" +
          // With optional
          "<parent parent-opt parent-or-sibling-1 parent-or-sibling-opt-1>" +
          "<me parent-or-sibling-2 parent-or-sibling-opt-2 sibling sibling-opt></me>" +
          "</parent>" +
          // Without optional
          "<parent parent-or-sibling-1>" +
          "<me parent-or-sibling-2 sibling></me>" +
          "</parent>" +
          "</div>";
        element = $compile(template)($rootScope);
        await wait();

        const ctrl1 = getController(element.querySelectorAll("me")[0], "me");
        expect(ctrl1.parent).toEqual(jasmine.any(ParentController));
        expect(ctrl1.parentOpt).toEqual(jasmine.any(ParentOptController));
        expect(ctrl1.parentOrSibling1).toEqual(
          jasmine.any(ParentOrSiblingController),
        );
        expect(ctrl1.parentOrSiblingOpt1).toEqual(
          jasmine.any(ParentOrSiblingOptController),
        );
        expect(ctrl1.parentOrSibling2).toEqual(
          jasmine.any(ParentOrSiblingController),
        );
        expect(ctrl1.parentOrSiblingOpt2).toEqual(
          jasmine.any(ParentOrSiblingOptController),
        );
        expect(ctrl1.sibling).toEqual(jasmine.any(SiblingController));
        expect(ctrl1.siblingOpt).toEqual(jasmine.any(SiblingOptController));

        const ctrl2 = getController(element.querySelectorAll("me")[1], "me");
        expect(ctrl2.parent).toEqual(jasmine.any(ParentController));
        expect(ctrl2.parentOpt).toBe(null);
        expect(ctrl2.parentOrSibling1).toEqual(
          jasmine.any(ParentOrSiblingController),
        );
        expect(ctrl2.parentOrSiblingOpt1).toBe(null);
        expect(ctrl2.parentOrSibling2).toEqual(
          jasmine.any(ParentOrSiblingController),
        );
        expect(ctrl2.parentOrSiblingOpt2).toBe(null);
        expect(ctrl2.sibling).toEqual(jasmine.any(SiblingController));
        expect(ctrl2.siblingOpt).toBe(null);
      });

      it("should not bind required controllers if bindToController is falsy", async () => {
        let parentController;
        let siblingController;

        function ParentController() {
          this.name = "Parent";
        }
        function SiblingController() {
          this.name = "Sibling";
        }
        function MeController() {
          this.name = "Me";
        }
        MeController.prototype.$onInit = () => {
          parentController = this.container;
          siblingController = this.friend;
        };
        spyOn(MeController.prototype, "$onInit").and.callThrough();

        module
          .directive("me", () => ({
            restrict: "E",
            scope: {},
            require: { container: "^parent", friend: "sibling" },
            controller: MeController,
          }))
          .directive("parent", () => ({
            restrict: "E",
            scope: {},
            controller: ParentController,
          }))
          .directive("sibling", () => ({
            controller: SiblingController,
          }));
        initInjector("test1");
        element = $compile("<parent><me sibling></me></parent>")($rootScope);
        await wait();
        expect(MeController.prototype.$onInit).toHaveBeenCalled();
        expect(parentController).toBeUndefined();
        expect(siblingController).toBeUndefined();
      });

      it("should bind required controllers to controller that has an explicit constructor return value", () => {
        let parentController;
        let siblingController;
        let meController;

        function ParentController() {
          this.name = "Parent";
        }
        function SiblingController() {
          this.name = "Sibling";
        }
        function MeController() {
          meController = {
            name: "Me",
            $onInit() {
              parentController = this.container;
              siblingController = this.friend;
            },
          };
          spyOn(meController, "$onInit").and.callThrough();
          return meController;
        }

        module
          .directive("me", () => ({
            restrict: "E",
            scope: {},
            require: { container: "^parent", friend: "sibling" },
            bindToController: true,
            controller: MeController,
            controllerAs: "$ctrl",
          }))
          .directive("parent", () => ({
            restrict: "E",
            scope: {},
            controller: ParentController,
          }))
          .directive("sibling", () => ({
            controller: SiblingController,
          }));
        initInjector("test1");
        element = $compile("<parent><me sibling></me></parent>")($rootScope);
        expect(meController.$onInit).toHaveBeenCalled();
        expect(parentController).toEqual(jasmine.any(ParentController));
        expect(siblingController).toEqual(jasmine.any(SiblingController));
      });

      it("should bind required controllers to controllers that return an explicit constructor return value", () => {
        let parentController;
        let containerController;
        let siblingController;
        let friendController;

        function MeController() {
          this.name = "Me";
          this.$onInit = () => {
            containerController = this.container;
            friendController = this.friend;
          };
        }
        function ParentController() {
          parentController = { name: "Parent" };
          return parentController;
        }
        function SiblingController() {
          siblingController = { name: "Sibling" };
          return siblingController;
        }

        module
          .directive("me", () => ({
            priority: 1, // make sure it is run before sibling to test this case correctly
            restrict: "E",
            scope: {},
            require: { container: "^parent", friend: "sibling" },
            bindToController: true,
            controller: MeController,
            controllerAs: "$ctrl",
          }))
          .directive("parent", () => ({
            restrict: "E",
            scope: {},
            controller: ParentController,
          }))
          .directive("sibling", () => ({
            controller: SiblingController,
          }));
        initInjector("test1");
        element = $compile("<parent><me sibling></me></parent>")($rootScope);
        expect(containerController).toEqual(parentController);
        expect(friendController).toEqual(siblingController);
      });

      it("should require controller of an isolate directive from a non-isolate directive on the same element", () => {
        const IsolateController = function () {};
        let isolateDirControllerInNonIsolateDirective;

        module
          .directive("isolate", () => ({
            scope: {},
            controller: IsolateController,
          }))
          .directive("nonIsolate", () => ({
            require: "isolate",
            link(_, __, ___, isolateDirController) {
              isolateDirControllerInNonIsolateDirective = isolateDirController;
            },
          }));
        initInjector("test1");
        element = $compile("<div isolate non-isolate></div>")($rootScope);

        expect(isolateDirControllerInNonIsolateDirective).toBeDefined();
        expect(
          isolateDirControllerInNonIsolateDirective instanceof
            IsolateController,
        ).toBe(true);
      });

      it("should give the isolate scope to the controller of another replaced directives in the template", async () => {
        module.directive("testDirective", () => ({
          replace: true,
          restrict: "E",
          scope: {},
          template: '<input type="checkbox" ng-model="model">',
        }));
        initInjector("test1");
        element = $compile("<div><test-directive></test-directive></div>")(
          $rootScope,
        );
        await wait();
        element = element.firstChild;
        expect(element.checked).toBe(false);
        $rootScope.$children[0].model = true;
        await wait();
        expect(element.checked).toBe(true);
      });

      it("should share isolate scope with replaced directives (template)", async () => {
        let normalScope;
        let isolateScope;

        module
          .directive("isolate", () => ({
            replace: true,
            scope: {},
            template: "<span ng-init=\"name='WORKS'\">{{name}}</span>",
            link(s) {
              isolateScope = s;
            },
          }))
          .directive("nonIsolate", () => ({
            link(s) {
              normalScope = s;
            },
          }));
        initInjector("test1");
        element = $compile("<div isolate non-isolate></div>")($rootScope);
        await wait();
        expect(normalScope).toBe($rootScope);
        expect(normalScope.name).toEqual(undefined);
        expect(isolateScope.name).toEqual("WORKS");
        expect(element.textContent).toEqual("WORKS");
      });

      it("should share isolate scope with replaced directives (templateUrl)", async () => {
        let normalScope;
        let isolateScope;

        module
          .directive("isolate", () => ({
            replace: true,
            scope: {},
            templateUrl: "main.html",
            link(s) {
              isolateScope = s;
            },
          }))
          .directive("nonIsolate", () => ({
            link(s) {
              normalScope = s;
            },
          }));

        bootstrap("<div isolate non-isolate></div>", "test1").invoke(
          ($templateCache) => {
            $templateCache.set(
              "main.html",
              "<span ng-init=\"name='WORKS'\">{{name}}</span>",
            );
          },
        );

        await wait();

        expect(normalScope.name).toEqual(undefined);
        expect(isolateScope.name).toEqual("WORKS");
        expect(ELEMENT.textContent).toEqual("WORKS");
        dealoc(ELEMENT);
      });

      it("should not get confused about where to use isolate scope when a replaced directive is used multiple times", async () => {
        module
          .directive("isolate", () => ({
            replace: true,
            scope: {},
            template:
              '<span scope-tester="replaced"><span scope-tester="inside"></span></span>',
          }))
          .directive("scopeTester", () => ({
            link($scope, $element) {
              log.push(
                `${$element.getAttribute("scope-tester")}=${$scope.$root.$id === $scope.$id ? "non-isolate" : "isolate"}`,
              );
            },
          }));
        initInjector("test1");
        $compile(
          "<div>" +
            '<div isolate scope-tester="outside"></div>' +
            '<span scope-tester="sibling"></span>' +
            "</div>",
        )($rootScope);
        await wait();
        expect(log.join("; ")).toEqual(
          "inside=isolate; " +
            "outside replaced=non-isolate; " + // outside
            "outside replaced=isolate; " + // replaced
            "sibling=non-isolate",
        );
      });

      it(
        "should require controller of a non-isolate directive from an isolate directive on the " +
          "same element",
        async () => {
          const NonIsolateController = function () {};
          let nonIsolateDirControllerInIsolateDirective;

          module
            .directive("isolate", () => ({
              scope: {},
              require: "nonIsolate",
              link(_, __, ___, nonIsolateDirController) {
                nonIsolateDirControllerInIsolateDirective =
                  nonIsolateDirController;
              },
            }))
            .directive("nonIsolate", () => ({
              controller: NonIsolateController,
            }));
          initInjector("test1");
          element = $compile("<div isolate non-isolate></div>")($rootScope);
          await wait();
          expect(nonIsolateDirControllerInIsolateDirective).toBeDefined();
          expect(
            nonIsolateDirControllerInIsolateDirective instanceof
              NonIsolateController,
          ).toBe(true);
        },
      );

      it("should support controllerAs", async () => {
        module.directive("main", () => ({
          templateUrl: "main.html",
          transclude: true,
          scope: {},
          controller() {
            this.name = "lucas";
          },
          controllerAs: "mainCtrl",
        }));
        initInjector("test1");
        $templateCache.set(
          "main.html",
          "<span>template:{{mainCtrl.name}} <div ng-transclude></div></span>",
        );
        element = $compile("<div main>transclude:{{mainCtrl.name}}</div>")(
          $rootScope,
        );
        await wait();
        expect(element.textContent).toBe("template:lucas transclude:");
      });

      it("should support controller alias", async () => {
        module
          .controller("MainCtrl", function () {
            this.name = "lucas";
          })
          .directive("main", () => ({
            templateUrl: "main.html",
            scope: {},
            controller: "MainCtrl as mainCtrl",
          }));
        initInjector("test1");
        $templateCache.set("main.html", "<span>{{mainCtrl.name}}</span>");
        element = $compile("<div main></div>")($rootScope);
        await wait();
        expect(element.textContent).toBe("lucas");
      });

      it("should require controller on parent element", () => {
        module
          .directive("main", () => ({
            controller() {
              this.name = "main";
            },
          }))
          .directive("dep", () => ({
            require: "^main",
            link(scope, element, attrs, controller) {
              log.push(`dep:${controller.name}`);
            },
          }));
        initInjector("test1");
        element = $compile("<div main><div dep></div></div>")($rootScope);
        expect(log[0]).toEqual("dep:main");
      });

      it("should throw an error if required controller can't be found", () => {
        module.directive("dep", () => ({
          require: "^main",
          link(scope, element, attrs, controller) {
            log.push(`dep:${controller.name}`);
          },
        }));
        initInjector("test1");
        expect(() => {
          $compile("<div main><div dep></div></div>")($rootScope);
        }).toThrowError(/ctreq/);
      });

      it("should pass null if required controller can't be found and is optional", () => {
        module.directive("dep", () => ({
          require: "?^main",
          link(scope, element, attrs, controller) {
            log.push(`dep:${controller}`);
          },
        }));
        initInjector("test1");
        $compile("<div main><div dep></div></div>")($rootScope);
        expect(log[0]).toEqual("dep:null");
      });

      it("should pass null if required controller can't be found and is optional with the question mark on the right", () => {
        module.directive("dep", () => ({
          require: "^?main",
          link(scope, element, attrs, controller) {
            log.push(`dep:${controller}`);
          },
        }));
        initInjector("test1");
        $compile("<div main><div dep></div></div>")($rootScope);
        expect(log[0]).toEqual("dep:null");
      });

      it("should have optional controller on current element", () => {
        module.directive("dep", () => ({
          require: "?main",
          link(scope, element, attrs, controller) {
            log.push(`dep:${!!controller}`);
          },
        }));
        initInjector("test1");
        element = $compile("<div main><div dep></div></div>")($rootScope);
        expect(log[0]).toEqual("dep:false");
      });

      it("should support multiple controllers", () => {
        module
          .directive("c1", () => ({
            controller() {
              this.name = "c1";
            },
          }))
          .directive("c2", () => ({
            controller() {
              this.name = "c2";
            },
          }))
          .directive("dep", () => ({
            require: ["^c1", "^c2"],
            link(scope, element, attrs, controller) {
              log.push(`dep:${controller[0].name}-${controller[1].name}`);
            },
          }));
        initInjector("test1");
        element = $compile("<div c1 c2><div dep></div></div>")($rootScope);
        expect(log[0]).toEqual("dep:c1-c2");
      });

      it("should support multiple controllers as an object hash", () => {
        module
          .directive("c1", () => ({
            controller() {
              this.name = "c1";
            },
          }))
          .directive("c2", () => ({
            controller() {
              this.name = "c2";
            },
          }))
          .directive("dep", () => ({
            require: { myC1: "^c1", myC2: "^c2" },
            link(scope, element, attrs, controllers) {
              log.push(`dep:${controllers.myC1.name}-${controllers.myC2.name}`);
            },
          }));
        initInjector("test1");
        element = $compile("<div c1 c2><div dep></div></div>")($rootScope);
        expect(log[0]).toEqual("dep:c1-c2");
      });

      it("should support omitting the name of the required controller if it is the same as the key", () => {
        module
          .directive("myC1", () => ({
            controller() {
              this.name = "c1";
            },
          }))
          .directive("myC2", () => ({
            controller() {
              this.name = "c2";
            },
          }))
          .directive("dep", () => ({
            require: { myC1: "^", myC2: "^" },
            link(scope, element, attrs, controllers) {
              log.push(`dep:${controllers.myC1.name}-${controllers.myC2.name}`);
            },
          }));
        initInjector("test1");
        element = $compile("<div my-c1 my-c2><div dep></div></div>")(
          $rootScope,
        );
        expect(log[0]).toEqual("dep:c1-c2");
      });

      it("should instantiate the controller just once when template/templateUrl", async () => {
        const syncCtrlSpy = jasmine.createSpy("sync controller");
        const asyncCtrlSpy = jasmine.createSpy("async controller");

        module
          .directive("myDirectiveSync", () => ({
            template: "<div>Hello!</div>",
            controller: syncCtrlSpy,
          }))
          .directive("myDirectiveAsync", () => ({
            templateUrl: "myDirectiveAsync.html",
            controller: asyncCtrlSpy,
            compile() {
              return () => {};
            },
          }));
        initInjector("test1");
        expect(syncCtrlSpy).not.toHaveBeenCalled();
        expect(asyncCtrlSpy).not.toHaveBeenCalled();

        $templateCache.set("myDirectiveAsync.html", "<div>Hello!</div>");
        element = $compile(
          "<div>" +
            "<span xmy-directive-sync></span>" +
            "<span my-directive-async></span>" +
            "</div>",
        )($rootScope);
        expect(syncCtrlSpy).not.toHaveBeenCalled();
        expect(asyncCtrlSpy).not.toHaveBeenCalled();

        await wait();

        // expect(syncCtrlSpy).toHaveBeenCalled();
        expect(asyncCtrlSpy).toHaveBeenCalled();
      });

      it("should instantiate controllers in the parent->child order when transclusion, templateUrl and replacement are in the mix", async () => {
        // When a child controller is in the transclusion that replaces the parent element that has a directive with
        // a controller, we should ensure that we first instantiate the parent and only then stuff that comes from the
        // transclusion.
        //
        // The transclusion moves the child controller onto the same element as parent controller so both controllers are
        // on the same level.

        module
          .directive("parentDirective", () => ({
            transclude: true,
            replace: true,
            templateUrl: "parentDirective.html",
            controller() {
              log.push("parentController");
            },
          }))
          .directive("childDirective", () => ({
            require: "^parentDirective",
            templateUrl: "childDirective.html",
            controller() {
              log.push("childController");
            },
          }));

        bootstrap(
          "<div parent-directive><div child-directive></div>childContentText;</div>",
          "test1",
        ).invoke(($templateCache) => {
          $templateCache.set(
            "parentDirective.html",
            "<div ng-transclude>parentTemplateText;</div>",
          );
          $templateCache.set(
            "childDirective.html",
            "<span>childTemplateText;</span>",
          );
        });
        await wait();
        expect(log.join("; ")).toEqual("parentController; childController");
        expect(ELEMENT.textContent).toBe("childTemplateText;childContentText;");
      });

      it("should instantiate the controller after the isolate scope bindings are initialized (with template)", async () => {
        const Ctrl = function ($scope) {
          log.push(`myFoo=${$scope.myFoo}`);
        };

        module.directive("myDirective", () => ({
          scope: {
            myFoo: "=",
          },
          template: "<p>Hello</p>",
          controller: Ctrl,
        }));
        initInjector("test1");
        $rootScope.foo = "bar";

        element = $compile('<div my-directive my-foo="foo"></div>')($rootScope);
        await wait();
        expect(log[0]).toEqual("myFoo=bar");
      });

      it("should instantiate the controller after the isolate scope bindings are initialized (with templateUrl)", async () => {
        const Ctrl = function ($scope) {
          log.push(`myFoo=${$scope.myFoo}`);
        };

        module.directive("myDirective", () => ({
          scope: {
            myFoo: "=",
          },
          templateUrl: "/mock/hello",
          controller: Ctrl,
        }));
        initInjector("test1");
        $templateCache.set("/mock/hello", "<p>Hello</p>");
        $rootScope.foo = "bar";

        element = $compile('<div my-directive my-foo="foo"></div>')($rootScope);
        await wait();
        expect(log[0]).toEqual("myFoo=bar");
      });

      it("should instantiate controllers in the parent->child->baby order when nested transclusion, templateUrl and replacement are in the mix", async () => {
        // similar to the test above, except that we have one more layer of nesting and nested transclusion

        module
          .directive("parentDirective", () => ({
            transclude: true,
            replace: true,
            templateUrl: "parentDirective.html",
            controller() {
              log.push("parentController");
            },
          }))
          .directive("childDirective", () => ({
            require: "^parentDirective",
            transclude: true,
            replace: true,
            templateUrl: "childDirective.html",
            controller() {
              log.push("childController");
            },
          }))
          .directive("babyDirective", () => ({
            require: "^childDirective",
            templateUrl: "babyDirective.html",
            controller() {
              log.push("babyController");
            },
          }));

        bootstrap(
          "<div parent-directive>" +
            "<div child-directive>" +
            "childContentText;" +
            "<div baby-directive>babyContent;</div>" +
            "</div>" +
            "</div>",
          "test1",
        ).invoke(($templateCache) => {
          $templateCache.set(
            "parentDirective.html",
            "<div ng-transclude>parentTemplateText;</div>",
          );
          $templateCache.set(
            "childDirective.html",
            "<span ng-transclude>childTemplateText;</span>",
          );
          $templateCache.set(
            "babyDirective.html",
            "<span>babyTemplateText;</span>",
          );
        });
        await wait();
        expect(log.join("; ")).toEqual(
          "parentController; childController; babyController",
        );
        expect(ELEMENT.textContent).toBe("childContentText;babyTemplateText;");
      });

      it("should allow controller usage in pre-link directive functions with templateUrl", async () => {
        const Ctrl = () => {
          log.push("instance");
        };

        module.directive("myDirective", () => ({
          scope: true,
          templateUrl: "/mock/hello",
          controller: Ctrl,
          compile() {
            return {
              pre(scope, template, attr, ctrl) {},
              post() {},
            };
          },
        }));
        initInjector("test1");
        $templateCache.set("/mock/hello", "<p>Hello</p>");

        element = $compile("<div my-directive></div>")($rootScope);
        await wait();

        expect(log[0]).toEqual("instance");
        expect(element.textContent).toBe("Hello");
      });

      it("should allow controller usage in pre-link directive functions with a template", async () => {
        const Ctrl = () => {
          log.push("instance");
        };

        module.directive("myDirective", () => ({
          scope: true,
          template: "<p>Hello</p>",
          controller: Ctrl,
          compile() {
            return {
              pre(scope, template, attr, ctrl) {},
              post() {},
            };
          },
        }));
        initInjector("test1");
        element = $compile("<div my-directive></div>")($rootScope);
        await wait();

        expect(log[0]).toEqual("instance");
        expect(element.textContent).toBe("Hello");
      });

      it("should throw ctreq with correct directive name, regardless of order", () => {
        module.directive("aDir", () => ({
          restrict: "E",
          require: "ngModel",
          link: () => {},
        }));
        initInjector("test1");
        expect(() => {
          // a-dir will cause a ctreq error to be thrown. Previously, the error would reference
          // the last directive in the chain (which in this case would be ngClick), based on
          // priority and alphabetical ordering. This test verifies that the ordering does not
          // affect which directive is referenced in the minErr message.
          element = $compile('<a-dir ng-click="foo=bar"></a-dir>')($rootScope);
        }).toThrowError(/ctreq/);
      });
    });
  });

  describe("$compile", () => {
    // const { document } = window;

    // let directive;

    // beforeEach(() => {
    //   module(provideLog, ($provide, $compileProvider) => {
    //     element = null;
    //     directive = $compileProvider.directive;
    //     return function (_$compile_, _$rootScope_) {
    //       $rootScope = _$rootScope_;
    //       $compile = _$compile_;
    //     };
    // });

    // function compile(html) {
    //   element = angular.element(html);
    //   $compile(element)($rootScope);
    // }

    describe("transclude", () => {
      describe("content transclusion", () => {
        it("should support transclude directive", async () => {
          module.directive("trans", () => ({
            transclude: true,
            replace: true,
            scope: {},
            link(scope) {
              scope.x = "iso";
            },
            template: "<ul><li>W:{{x}}</li><li ng-transclude></li></ul>",
          }));
          initInjector("test1");
          element = $compile(
            "<div><div trans>T:{{x}}<span>;</span></div></div>",
          )($rootScope);
          $rootScope.x = "root";
          await wait();
          expect(element.textContent).toEqual("W:isoT:root;");
          expect(
            element.querySelectorAll("li")[1].childNodes[0].textContent,
          ).toEqual("T:root");
          expect(element.querySelector("span").innerText).toEqual(";");
        });

        it("should transclude transcluded content", async () => {
          module
            .directive("book", () => ({
              transclude: "content",
              template:
                "<div>book-<div chapter>(<div ng-transclude></div>)</div></div>",
            }))
            .directive("chapter", () => ({
              transclude: "content",
              templateUrl: "chapter.html",
            }))
            .directive("section", () => ({
              transclude: "content",
              template: "<div>section-!<div ng-transclude></div>!</div></div>",
            }));

          bootstrap("<div><div book>paragraph</div></div>", "test1").invoke(
            ($templateCache) => {
              $templateCache.set(
                "chapter.html",
                "<div>chapter-<div section>[<div ng-transclude></div>]</div></div>",
              );
            },
          );
          expect(ELEMENT.textContent).toEqual("book-");
          await wait();
          expect(ELEMENT.textContent).toEqual(
            "book-chapter-section-![(paragraph)]!",
          );
        });

        it("should compile directives with lower priority than ngTransclude", async () => {
          let ngTranscludePriority;
          const lowerPriority = -1;

          module
            .directive("lower", () => ({
              priority: lowerPriority,
              link: {
                pre() {
                  log.push("pre");
                },
                post() {
                  log.push("post");
                },
              },
            }))
            .directive("trans", () => ({
              transclude: true,
              template: "<div lower ng-transclude></div>",
            }))
            .decorator("ngTranscludeDirective", ($delegate) => {
              ngTranscludePriority = $delegate[0].priority;
              return $delegate;
            });

          initInjector("test1");
          element = $compile(
            "<div trans><span>transcluded content</span></div>",
          )($rootScope);

          expect(lowerPriority).toBeLessThan(ngTranscludePriority);

          await wait();

          expect(element.textContent).toEqual("transcluded content");
          expect(log.join("; ")).toEqual("pre; post");
        });

        it("should not merge text elements from transcluded content", async () => {
          module.directive("foo", () => ({
            transclude: "content",
            template: "<div>This is before {{before}}. </div>",
            link(scope, element, attr, ctrls, $transclude) {
              const futureParent = element.firstChild;
              $transclude((clone) => {
                futureParent.append(clone);
              }, futureParent);
            },
            scope: true,
          }));
          initInjector("test1");
          element = $compile(
            "<div><div foo>This is after {{after}}</div></div>",
          )($rootScope);
          $rootScope.before = "BEFORE";
          $rootScope.after = "AFTER";
          await wait();
          expect(element.textContent).toEqual(
            "This is before BEFORE. This is after AFTER",
          );

          $rootScope.before = "Not-Before";
          $rootScope.after = "AfTeR";
          $rootScope.$children[0].before = "BeFoRe";
          $rootScope.$children[0].after = "Not-After";
          await wait();
          expect(element.textContent).toEqual(
            "This is before BeFoRe. This is after AfTeR",
          );
        });

        it("should only allow one content transclusion per element", () => {
          module
            .directive("first", () => ({
              transclude: true,
            }))
            .directive("second", () => ({
              transclude: true,
            }));
          initInjector("test1");
          expect(() => {
            $compile('<div first="" second=""></div>');
          }).toThrowError(/multidir/);
        });

        // see issue https://github.com/angular/angular.js/issues/12936
        it("should use the proper scope when it is on the root element of a replaced directive template", async () => {
          module
            .directive("isolate", () => ({
              scope: {},
              replace: true,
              template: "<div trans>{{x}}</div>",
              link(scope, element, attr, ctrl) {
                scope.x = "iso";
              },
            }))
            .directive("trans", () => ({
              transclude: "content",
              link(scope, element, attr, ctrl, $transclude) {
                $transclude((clone) => {
                  element.append(clone);
                });
              },
            }));
          initInjector("test1");
          element = $compile("<isolate></isolate>")($rootScope);
          $rootScope.x = "root";
          await wait();
          expect(element.textContent).toEqual("iso");
        });

        // see issue https://github.com/angular/angular.js/issues/12936
        it("should use the proper scope when it is on the root element of a replaced directive template with child scope", async () => {
          module
            .directive("child", () => ({
              scope: true,
              replace: true,
              template: "<div trans>{{x}}</div>",
              link(scope, element, attr, ctrl) {
                scope.x = "child";
              },
            }))
            .directive("trans", () => ({
              transclude: "content",
              link(scope, element, attr, ctrl, $transclude) {
                $transclude((clone) => {
                  element.append(clone);
                });
              },
            }));
          initInjector("test1");
          element = $compile("<child></child>")($rootScope);
          $rootScope.x = "root";
          await wait();
          expect(element.textContent).toEqual("child");
        });

        it("should throw if a transcluded node is transcluded again", () => {
          module
            .directive("trans", () => ({
              transclude: true,
              link(scope, element, attr, ctrl, $transclude) {
                $transclude();
                $transclude();
              },
            }))
            .decorator("$exceptionHandler", () => {
              return (exception, cause) => {
                throw new Error(exception.message);
              };
            });
          initInjector("test1");
          expect(() => {
            $compile("<trans></trans>")($rootScope);
          }).toThrowError(/multilink/);
        });

        it('should not leak if two "element" transclusions are on the same element', async () => {
          const cacheSize = Cache.size;

          bootstrap(
            '<div><div ng-repeat="x in xs" ng-if="x==1">{{x}}</div></div>',
          );
          await wait();
          expect(Cache.size).toEqual(cacheSize);

          $rootScope.$apply("xs = [0,1]");
          await wait();
          expect(Cache.size).toEqual(cacheSize);

          $rootScope.$apply("xs = [0]");
          await wait();
          expect(Cache.size).toEqual(cacheSize);

          $rootScope.$apply("xs = []");
          await wait();
          expect(Cache.size).toEqual(cacheSize);

          dealoc(ELEMENT.firstChild);
          await wait();
          expect(Cache.size).toEqual(cacheSize);
        });

        it('should not leak if two "element" transclusions are on the same element', async () => {
          const cacheSize = Cache.size;
          bootstrap(
            '<div><div ng-repeat="x in xs" ng-if="val">{{x}}</div></div>',
          );

          $rootScope.$apply("xs = [0,1]");
          await wait();
          // At this point we have a bunch of comment placeholders but no real transcluded elements
          // So the cache only contains the root element's data
          expect(Cache.size).toEqual(cacheSize);

          $rootScope.$apply("val = true");
          // Now we have two concrete transcluded elements plus some comments so two more cache items
          expect(Cache.size).toEqual(cacheSize);

          $rootScope.$apply("val = false");
          await wait();
          // Once again we only have comments so no transcluded elements and the cache is back to just
          // the root element
          expect(Cache.size).toEqual(cacheSize);

          dealoc(ELEMENT.firstChild);
          await wait();
          // Now we've even removed the root element along with its cache
          expect(Cache.size).toEqual(cacheSize);
        });

        // it("should not leak when continuing the compilation of elements on a scope that was destroyed", () => {
        //   const linkFn = jasmine.createSpy("linkFn");

        //   module
        //     .controller("Leak", ($scope, $timeout) => {
        //       $scope.code = "red";
        //       setTimeout(() => {
        //         $scope.code = "blue";
        //       });
        //     })
        //     .directive("isolateRed", () => ({
        //       restrict: "A",
        //       scope: {},
        //       template: "<div red></div>",
        //     }))
        //     .directive("red", () => ({
        //       restrict: "A",
        //       templateUrl: "red.html",
        //       scope: {},
        //       link: linkFn,
        //     }));
        //   initInjector("test1");
        //   const cacheSize = Cache.size;
        //   $templateCache.set("red.html", "<p>red</p>");
        //   const template = $compile(
        //     '<div ng-controller="Leak">' +
        //       '<div ng-switch="code">' +
        //         '<div ng-switch-when="red">' +
        //           "<div isolate-red></div>" +
        //         "</div>" +
        //       "</div>" +
        //     "</div>",
        //   );
        //   element = template($rootScope, function () {});
        //   ;

        //   expect(linkFn).toHaveBeenCalled();
        //   expect(Cache.size).toEqual(cacheSize + 2);

        //   $templateCache = new Map();
        //   const destroyedScope = $rootScope.$new();
        //   destroyedScope.$destroy();
        //   const clone = template(destroyedScope, () => {});
        //   ;
        //   // expect(linkFn).not.toHaveBeenCalled();
        //   // clone.remove();
        // });

        it("should add a $$transcluded property onto the transcluded scope", async () => {
          module.directive("trans", () => ({
            transclude: true,
            replace: true,
            scope: true,
            template:
              "<div><span>I:{{$$transcluded}}</span><span ng-transclude></span></div>",
          }));
          bootstrap("<div><div trans>T:{{$$transcluded}}</div></div>", "test1");
          await wait();
          expect(ELEMENT.querySelectorAll("span")[0].innerText).toEqual("I:");
          expect(ELEMENT.querySelectorAll("span")[1].innerText).toEqual(
            "T:true",
          );
        });

        it("should clear contents of the ng-transclude element before appending transcluded content if transcluded content exists", async () => {
          module.directive("trans", () => ({
            transclude: true,
            template: "<div ng-transclude>old stuff!</div>",
          }));
          initInjector("test1");
          element = $compile("<div trans>unicorn!</div>")($rootScope);
          await wait();
          expect(element.innerHTML).toEqual(
            '<div ng-transclude="">unicorn!</div>',
          );
        });

        it("should NOT clear contents of the ng-transclude element before appending transcluded content if transcluded content does NOT exist", async () => {
          module.directive("trans", () => ({
            transclude: true,
            template: "<div ng-transclude>old stuff!</div>",
          }));
          bootstrap("<div trans></div>", "test1");
          await wait();
          expect(ELEMENT.innerHTML).toEqual(
            '<div trans=""><div ng-transclude="">old stuff!</div></div>',
          );
        });

        it("should clear the fallback content from the element during compile and before linking", async () => {
          module.directive("trans", () => ({
            transclude: true,
            template: "<div ng-transclude>fallback content</div>",
          }));
          initInjector("test1");
          element = $("<div trans></div>");
          const linkfn = $compile(element);
          await wait();
          expect(element.innerHTML).toEqual('<div ng-transclude=""></div>');
          linkfn($rootScope);
          await wait();
          expect(element.innerHTML).toEqual(
            '<div ng-transclude="">fallback content</div>',
          );
        });

        it("should allow cloning of the fallback via ngRepeat", async () => {
          module.directive("trans", () => ({
            transclude: true,
            template:
              '<div ng-repeat="i in [0,1,2]"><div ng-transclude>{{i}}</div></div>',
          }));
          initInjector("test1");
          element = $compile("<div trans></div>")($rootScope);
          await wait();
          expect(element.textContent).toEqual("012");
        });

        it("should not link the fallback content if transcluded content is provided", async () => {
          const linkSpy = jasmine.createSpy("postlink");

          module
            .directive("inner", () => ({
              restrict: "E",
              template: "old stuff! ",
              link: linkSpy,
            }))
            .directive("trans", () => ({
              transclude: true,
              template: "<div ng-transclude><inner></inner></div>",
            }));
          initInjector("test1");
          element = $compile("<div trans>unicorn!</div>")($rootScope);
          await wait();
          expect(element.innerHTML).toEqual(
            '<div ng-transclude="">unicorn!</div>',
          );
          expect(linkSpy).not.toHaveBeenCalled();
        });

        it("should compile and link the fallback content if no transcluded content is provided", async () => {
          const linkSpy = jasmine.createSpy("postlink");

          module
            .directive("inner", () => ({
              restrict: "E",
              template: "old stuff! ",
              link: linkSpy,
            }))
            .directive("trans", () => ({
              transclude: true,
              template: "<div ng-transclude><inner></inner></div>",
            }));
          initInjector("test1");
          element = $compile("<div trans></div>")($rootScope);
          wait();
          expect(element.innerHTML).toEqual(
            '<div ng-transclude=""><inner>old stuff! </inner></div>',
          );
          expect(linkSpy).toHaveBeenCalled();
        });

        it("should compile and link the fallback content if only whitespace transcluded content is provided", async () => {
          const linkSpy = jasmine.createSpy("postlink");

          module
            .directive("inner", () => ({
              restrict: "E",
              template: "old stuff! ",
              link: linkSpy,
            }))
            .directive("trans", () => ({
              transclude: true,
              template: "<div ng-transclude><inner></inner></div>",
            }));
          initInjector("test1");
          element = $compile("<div trans>\n  \n</div>")($rootScope);
          await wait();
          expect(element.innerHTML).toEqual(
            '<div ng-transclude=""><inner>old stuff! </inner></div>',
          );
          expect(linkSpy).toHaveBeenCalled();
        });

        it("should not link the fallback content if only whitespace and comments are provided as transclude content", async () => {
          const linkSpy = jasmine.createSpy("postlink");

          module
            .directive("inner", () => ({
              restrict: "E",
              template: "old stuff! ",
              link: linkSpy,
            }))
            .directive("trans", () => ({
              transclude: true,
              template: "<div ng-transclude><inner></inner></div>",
            }));
          initInjector("test1");
          element = $compile("<div trans>\n<!-- some comment -->  \n</div>")(
            $rootScope,
          );
          await wait();
          expect(element.innerHTML).toEqual(
            '<div ng-transclude="">\n<!-- some comment -->  \n</div>',
          );
          expect(linkSpy).not.toHaveBeenCalled();
        });

        it("should compile and link the fallback content if an optional transclusion slot is not provided", async () => {
          const linkSpy = jasmine.createSpy("postlink");

          module
            .directive("inner", () => ({
              restrict: "E",
              template: "old stuff! ",
              link: linkSpy,
            }))

            .directive("trans", () => ({
              transclude: { optionalSlot: "?optional" },
              template:
                '<div ng-transclude="optionalSlot"><inner></inner></div>',
            }));
          bootstrap("<div trans></div>", "test1");
          await wait();
          expect(ELEMENT.firstChild.innerHTML).toEqual(
            '<div ng-transclude="optionalSlot"><inner>old stuff! </inner></div>',
          );
          expect(linkSpy).toHaveBeenCalled();
        });

        it("should cope if there is neither transcluded content nor fallback content", async () => {
          module.directive("trans", () => ({
            transclude: true,
            template: "<div ng-transclude></div>",
          }));
          initInjector("test1");
          element = $compile("<div trans></div>")($rootScope);
          await wait();
          expect(element.innerHTML).toEqual('<div ng-transclude=""></div>');
        });

        it("should throw on an ng-transclude element inside no transclusion directive", async () => {
          let error;
          module.decorator("$exceptionHandler", () => {
            return (exception, cause) => {
              throw new Error(exception.message);
            };
          });
          initInjector("test1");
          try {
            $compile("<div><div ng-transclude></div></div>")($rootScope);
            await wait();
          } catch (e) {
            error = e;
          }

          expect(error).toBeTruthy();
          // we need to do this because different browsers print empty attributes differently
        });

        it("should not pass transclusion into a template directive when the directive didn't request transclusion", async () => {
          let error;
          module
            .decorator("$exceptionHandler", () => {
              return (exception) => {
                error = exception.message;
              };
            })
            .directive("transFoo", () => ({
              template: "<div no-trans-bar></div>",
              transclude: true,
            }))
            .directive("noTransBar", () => ({
              template:
                "<div>" +
                // This ng-transclude is invalid. It should throw an error.
                '<div class="bar" ng-transclude></div>' +
                "</div>",
              transclude: false,
            }));
          initInjector("test1");
          bootstrap("<div trans-foo>content</div>", "test1");
          await wait();

          expect(error).toMatch(/orphan/);
        });

        it("should not pass transclusion into a templateUrl directive", (done) => {
          module
            .decorator("$exceptionHandler", () => {
              return (exception, cause) => {
                expect(exception.message).toMatch(/orphan/);
                done();
              };
            })
            .directive("transFoo", () => ({
              template:
                "<div>" +
                "<div no-trans-bar></div>" +
                "<div ng-transclude>this one should get replaced with content</div>" +
                '<div class="foo" ng-transclude></div>' +
                "</div>",
              transclude: true,
            }))
            .directive("noTransBar", () => ({
              templateUrl: "noTransBar.html",
              transclude: false,
            }));
          initInjector("test1");
          $templateCache.set(
            "noTransBar.html",
            "<div>" +
              // This ng-transclude is invalid. It should throw an error.
              '<div class="bar" ng-transclude></div>' +
              "</div>",
          );

          $compile("<div trans-foo>content</div>")($rootScope);
        });

        it("should expose transcludeFn in compile fn even for templateUrl", async () => {
          module.directive("transInCompile", () => ({
            transclude: true,
            // template: '<div class="foo">whatever</div>',
            templateUrl: "foo.html",
            compile(_, __, transclude) {
              return function (scope, element) {
                transclude(scope, (clone, scope) => {
                  element.innerHTML = "";
                  element.append(clone);
                });
              };
            },
          }));
          bootstrap(
            "<div trans-in-compile>transcluded content</div>",
            "test1",
          ).invoke(($templateCache) => {
            $templateCache.set("foo.html", '<div class="foo">whatever</div>');
          });
          await wait();

          expect(ELEMENT.textContent).toBe("transcluded content");
        });

        it("should make the result of a transclusion available to the parent directive in post-linking phase (template)", async () => {
          module.directive("trans", () => ({
            transclude: true,
            template: "<div ng-transclude></div>",
            link: {
              pre($scope, $element) {
                log.push(`pre(${$element.textContent})`);
              },
              post($scope, $element) {
                log.push(`post(${$element.textContent})`);
              },
            },
          }));
          initInjector("test1");
          element = $compile("<div trans><span>unicorn!</span></div>")(
            $rootScope,
          );
          await wait();
          expect(log.join("; ")).toEqual("pre(); post(unicorn!)");
        });

        it("should make the result of a transclusion available to the parent directive in post-linking phase (templateUrl)", async () => {
          // when compiling an async directive the transclusion is always processed before the directive
          // this is different compared to sync directive. delaying the transclusion makes little sense.

          module.directive("trans", () => ({
            transclude: true,
            templateUrl: "trans.html",
            link: {
              pre($scope, $element) {
                log.push(`pre(${$element.textContent})`);
              },
              post($scope, $element) {
                log.push(`post(${$element.textContent})`);
              },
            },
          }));
          initInjector("test1");
          $templateCache.set("trans.html", "<div ng-transclude></div>");

          element = $compile("<div trans><span>unicorn!</span></div>")(
            $rootScope,
          );
          await wait();
          expect(log.join("; ")).toEqual("pre(); post(unicorn!)");
        });

        it("should make the result of a transclusion available to the parent *replace* directive in post-linking phase (template)", async () => {
          module.directive("replacedTrans", () => ({
            transclude: true,
            replace: true,
            template: "<div ng-transclude></div>",
            link: {
              pre($scope, $element) {
                log.push(`pre(${$element.textContent})`);
              },
              post($scope, $element) {
                log.push(`post(${$element.textContent})`);
              },
            },
          }));
          initInjector("test1");
          element = $compile("<div replaced-trans><span>unicorn!</span></div>")(
            $rootScope,
          );
          await wait();
          expect(log.join("; ")).toEqual("pre(); post(unicorn!)");
        });

        it("should make the result of a transclusion available to the parent *replace* directive in post-linking phase (templateUrl)", async () => {
          module.directive("replacedTrans", () => ({
            transclude: true,
            replace: true,
            templateUrl: "trans.html",
            link: {
              pre($scope, $element) {
                log.push(`pre(${$element.textContent})`);
              },
              post($scope, $element) {
                log.push(`post(${$element.textContent})`);
              },
            },
          }));
          initInjector("test1");
          $templateCache.set("trans.html", "<div ng-transclude></div>");

          element = $compile("<div replaced-trans><span>unicorn!</span></div>")(
            $rootScope,
          );
          await wait();
          expect(log.join("; ")).toEqual("pre(); post(unicorn!)");
        });

        it("should copy the directive controller to all clones", () => {
          let transcludeCtrl;
          const cloneCount = 2;
          module.directive("transclude", () => ({
            transclude: "content",
            controller($transclude) {
              transcludeCtrl = this;
            },
            link(scope, el, attr, ctrl, $transclude) {
              let i;
              for (i = 0; i < cloneCount; i++) {
                $transclude(cloneAttach);
              }

              function cloneAttach(clone) {
                el.append(clone);
              }
            },
          }));
          initInjector("test1");
          element = $compile("<div transclude><span></span></div>")($rootScope);
          const children = element.children;
          let i;
          expect(transcludeCtrl).toBeDefined();

          expect(getCacheData(element, "$transcludeController")).toEqual(
            transcludeCtrl,
          );
          for (i = 0; i < cloneCount; i++) {
            expect(
              getCacheData(children[i], "$transcludeController"),
            ).toBeUndefined();
          }
        });

        it("should provide the $transclude controller local as 5th argument to the pre and post-link function", async () => {
          let ctrlTransclude;
          let preLinkTransclude;
          let postLinkTransclude;
          module.directive("transclude", () => ({
            transclude: "content",
            controller($transclude) {
              ctrlTransclude = $transclude;
            },
            compile() {
              return {
                pre(scope, el, attr, ctrl, $transclude) {
                  preLinkTransclude = $transclude;
                },
                post(scope, el, attr, ctrl, $transclude) {
                  postLinkTransclude = $transclude;
                },
              };
            },
          }));
          initInjector("test1");
          element = $compile("<div transclude></div>")($rootScope);
          await wait();
          expect(ctrlTransclude).toBeDefined();
          expect(ctrlTransclude).toBe(preLinkTransclude);
          expect(ctrlTransclude).toBe(postLinkTransclude);
        });

        it("should allow an optional scope argument in $transclude", async () => {
          let capturedChildCtrl;
          module.directive("transclude", () => ({
            transclude: "content",
            link(scope, element, attr, ctrl, $transclude) {
              scope.id = scope.$id;
              capturedChildCtrl = scope;
              $transclude(scope, (clone) => {
                element.append(clone);
              });
            },
          }));
          bootstrap("<div transclude>{{id}}</div>", "test1");
          await wait();
          expect(ELEMENT.textContent).toBe(`${capturedChildCtrl.$id}`);
        });

        it("should expose the directive controller to transcluded children", () => {
          let capturedChildCtrl;
          module
            .directive("transclude", () => ({
              transclude: "content",
              controller() {},
              link(scope, element, attr, ctrl, $transclude) {
                $transclude((clone) => {
                  element.append(clone);
                });
              },
            }))
            .directive("child", () => ({
              require: "^transclude",
              link(scope, element, attr, ctrl) {
                capturedChildCtrl = ctrl;
              },
            }));
          initInjector("test1");
          element = $compile("<div transclude><div child></div></div>")(
            $rootScope,
          );
          expect(capturedChildCtrl).toBeTruthy();
        });

        // See issue https://github.com/angular/angular.js/issues/14924
        it("should not process top-level transcluded text nodes merged into their sibling", async () => {
          module.directive("transclude", () => ({
            template: "<ng-transclude></ng-transclude>",
            transclude: true,
            scope: {},
          }));
          initInjector("test1");
          element = $("<div transclude></div>");
          element.appendChild(document.createTextNode("1{{ value }}"));
          element.appendChild(document.createTextNode("2{{ value }}"));
          element.appendChild(document.createTextNode("3{{ value }}"));

          $compile(element)($rootScope);
          $rootScope.$apply("value = 0");
          await wait();
          expect(element.textContent).toBe("102030");
        });

        // see issue https://github.com/angular/angular.js/issues/9413
        describe("passing a parent bound transclude function to the link function returned from `$compile`", () => {
          beforeEach(() => {
            module
              .directive("lazyCompile", ($compile) => ({
                compile(tElement, tAttrs) {
                  const content = tElement.childNodes[0];
                  tElement.innerHTML = "";
                  return function (scope, element, attrs, ctrls, transcludeFn) {
                    element.appendChild(content);
                    $compile(content)(scope, undefined, {
                      parentBoundTranscludeFn: transcludeFn,
                    });
                  };
                },
              }))
              .directive("toggle", () => ({
                scope: { t: "=toggle" },
                transclude: true,
                template:
                  '<div ng-if="t"><lazy-compile><div ng-transclude></div></lazy-compile></div>',
              }))
              .decorator("$exceptionHandler", () => {
                return (exception, cause) => {
                  throw new Error(exception.message);
                };
              });
          });

          it("should preserve the bound scope", async () => {
            let $injector = bootstrap(
              "<div>" +
                '<div toggle="t">' +
                "<span>{{t}}</span>" +
                "</div>" +
                "</div>",
              "test1",
            );
            await wait();

            $rootScope = $injector.get("$rootScope");
            $rootScope.t = false;
            await wait();
            expect(ELEMENT.textContent).toBe("");

            $rootScope.t = true;
            await wait();
            expect(ELEMENT.textContent).toBe("true");
          });

          it("should preserve the bound scope when using recursive transclusion", async () => {
            module.directive("recursiveTransclude", () => ({
              transclude: true,
              template:
                "<div><lazy-compile><div ng-transclude></div></lazy-compile></div>",
            }));
            initInjector("test1");
            element = $compile(
              "<div>" +
                '<div ng-init="outer=true"></div>' +
                '<div toggle="t">' +
                "<div recursive-transclude>" +
                "<span>{{t}}</span>" +
                "</div>" +
                "</div>" +
                "</div>",
            )($rootScope);

            $rootScope.$apply("t = false");
            await wait();
            expect(element.textContent).toBe("");

            $rootScope.$apply("t = true");
            await wait();
            expect(element.textContent).toBe("true");

            $rootScope.$apply("t = false");
            await wait();
            expect(element.textContent).toBe("");

            $rootScope.$apply("t = true");
            await wait();
            expect(element.textContent).toBe("true");
          });
        });

        // see issue https://github.com/angular/angular.js/issues/9095
        // TODO Migrate scope removal to mutation observer
        xdescribe("removing a transcluded element", () => {
          beforeEach(() => {
            module.directive("toggle", () => ({
              transclude: true,
              template: '<div ng-if="t"><div ng-transclude></div></div>',
            }));
            initInjector("test1");
          });

          it("should not leak the transclude scope when the transcluded content is an element transclusion directive", async () => {
            element = $compile(
              "<div toggle>" +
                "<div ng-repeat=\"msg in ['msg-1']\">{{ msg }}</div>" +
                "</div>",
            )($rootScope);
            await wait();
            $rootScope.$apply("t = true");
            await wait();
            expect(element.textContent).toContain("msg-1");
            // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
            expect($rootScope.$handler.$children.length).toBe(2);

            $rootScope.$apply("t = false");
            await wait();
            expect(element.textContent).not.toContain("msg-1");
            // Expected scopes: $rootScope
            expect($rootScope.$handler.$children.length).toBe(0);

            $rootScope.$apply("t = true");
            await wait();
            expect(element.textContent).toContain("msg-1");

            // Expected scopes: $rootScope, ngIf, transclusion, ngRepeat
            expect($rootScope.$handler.$children.length).toBe(2);

            $rootScope.$apply("t = false");
            await wait();
            expect(element.textContent).not.toContain("msg-1");
            // Expected scopes: $rootScope
            expect($rootScope.$handler.$children.length).toBe(0);
          });

          it("should not leak the transclude scope if the transcluded contains only comments", async () => {
            element = $compile("<div toggle><!-- some comment --></div>")(
              $rootScope,
            );
            await wait();
            $rootScope.$apply("t = true");
            await wait();
            expect(element.innerHTML).toContain("some comment");
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$handler.$children.length).toBe(2);

            $rootScope.$apply("t = false");
            await wait();
            expect(element.innerHTML).not.toContain("some comment");
            // Expected scopes: $rootScope
            expect($rootScope.$handler.$children.length).toBe(0);

            $rootScope.$apply("t = true");
            await wait();
            expect(element.innerHTML).toContain("some comment");
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$handler.$children.length).toBe(2);

            $rootScope.$apply("t = false");
            await wait();
            expect(element.innerHTML).not.toContain("some comment");
            // Expected scopes: $rootScope
            expect($rootScope.$handler.$children.length).toBe(0);
          });

          it("should not leak the transclude scope if the transcluded contains only text nodes", async () => {
            element = $compile("<div toggle>some text</div>")($rootScope);

            $rootScope.$apply("t = true");
            expect(element.innerHTML).toContain("some text");
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$handler.$children.length).toBe(2);

            $rootScope.$apply("t = false");
            expect(element.innerHTML).not.toContain("some text");
            // Expected scopes: $rootScope
            expect($rootScope.$handler.$children.length).toBe(0);

            $rootScope.$apply("t = true");
            expect(element.innerHTML).toContain("some text");
            // Expected scopes: $rootScope, ngIf, transclusion
            expect($rootScope.$handler.$children.length).toBe(2);

            $rootScope.$apply("t = false");
            expect(element.innerHTML).not.toContain("some text");
            // Expected scopes: $rootScope
            expect($rootScope.$handler.$children.length).toBe(0);
          });

          it("should mark as destroyed all sub scopes of the scope being destroyed", async () => {
            element = $compile(
              "<div toggle>" +
                "<div ng-repeat=\"msg in ['msg-1']\">{{ msg }}</div>" +
                "</div>",
            )($rootScope);
            await wait();
            $rootScope.$apply("t = true");
            await wait();
            const childScopes = getChildScopes($rootScope);

            $rootScope.$apply("t = false");
            await wait();
            for (let i = 0; i < childScopes.length; ++i) {
              expect(childScopes[i].$$destroyed).toBe(true);
            }
          });
        });

        describe("nested transcludes", () => {
          beforeEach(() => {
            module
              .directive("noop", () => ({}))
              .directive("sync", () => ({
                template: "<div ng-transclude></div>",
                transclude: true,
              }))
              .directive("async", () => ({
                templateUrl: "async",
                transclude: true,
              }))
              .directive("syncSync", () => ({
                template:
                  "<div noop><div sync><div ng-transclude></div></div></div>",
                transclude: true,
              }))
              .directive("syncAsync", () => ({
                template:
                  "<div noop><div async><div ng-transclude></div></div></div>",
                transclude: true,
              }))
              .directive("asyncSync", () => ({
                templateUrl: "asyncSync",
                transclude: true,
              }))
              .directive("asyncAsync", () => ({
                templateUrl: "asyncAsync",
                transclude: true,
              }));

            initInjector("test1");
            $templateCache.set("async", "<div ng-transclude></div>");
            $templateCache.set(
              "asyncSync",
              "<div noop><div sync><div ng-transclude></div></div></div>",
            );
            $templateCache.set(
              "asyncAsync",
              "<div noop><div async><div ng-transclude></div></div></div>",
            );
          });

          it("should allow nested transclude directives with sync template containing sync template", async () => {
            element = $compile("<div sync-sync>transcluded content</div>")(
              $rootScope,
            );
            await wait();
            expect(element.textContent).toEqual("transcluded content");
          });

          it("should allow nested transclude directives with sync template containing async template", async () => {
            element = $compile("<div sync-async>transcluded content</div>")(
              $rootScope,
            );
            await wait();
            expect(element.textContent).toEqual("transcluded content");
          });

          it("should allow nested transclude directives with async template containing sync template", async () => {
            element = $compile("<div async-sync>transcluded content</div>")(
              $rootScope,
            );
            await wait();
            expect(element.textContent).toEqual("transcluded content");
          });

          it("should allow nested transclude directives with async template containing async template", async () => {
            element = $compile("<div async-async>transcluded content</div>")(
              $rootScope,
            );
            await wait(100);
            expect(element.textContent).toEqual("transcluded content");
          });

          // REMOVE does not exit. TODO think about cache clean up
          // it("should not leak memory with nested transclusion", async () => {
          //   let size;
          //   const initialSize = Cache.size;

          //   element =
          //     '<div><ul><li ng-repeat="n in nums">{{n}} => <i ng-if="0 === n%2">Even</i><i ng-if="1 === n%2">Odd</i></li></ul></div>';
          //   $compile(element)($rootScope.$new());
          //   await wait();
          //   $rootScope.nums = [0, 1, 2];
          //   await wait();
          //   size = Cache.size;

          //   $rootScope.nums = [3, 4, 5];
          //   await wait();
          //   expect(Cache.size).toEqual(size);

          //   element.remove();
          //   expect(Cache.size).toEqual(initialSize);
          // });
        });

        describe("nested isolated scope transcludes", () => {
          beforeEach(() => {
            module
              .directive("trans", () => ({
                restrict: "E",
                template: "<div ng-transclude></div>",
                transclude: true,
              }))
              .directive("transAsync", () => ({
                restrict: "E",
                templateUrl: "transAsync",
                transclude: true,
              }))
              .directive("iso", () => ({
                restrict: "E",
                transclude: true,
                template: "<trans><span ng-transclude></span></trans>",
                scope: {},
              }))
              .directive("isoAsync1", () => ({
                restrict: "E",
                transclude: true,
                template:
                  "<trans-async><span ng-transclude></span></trans-async>",
                scope: {},
              }))
              .directive("isoAsync2", () => ({
                restrict: "E",
                transclude: true,
                templateUrl: "isoAsync",
                scope: {},
              }));

            $templateCache.set("transAsync", "<div ng-transclude></div>");
            $templateCache.set(
              "isoAsync",
              "<trans-async><span ng-transclude></span></trans-async>",
            );
          });

          it("should pass the outer scope to the transclude on the isolated template sync-sync", async () => {
            $rootScope.val = "transcluded content";
            element = $compile('<iso><span ng-bind="val"></span></iso>')(
              $rootScope,
            );
            await wait();
            expect(element.textContent).toEqual("transcluded content");
          });

          it("should pass the outer scope to the transclude on the isolated template async-sync", async () => {
            $rootScope.val = "transcluded content";
            element = $compile(
              '<iso-async1><span ng-bind="val"></span></iso-async1>',
            )($rootScope);
            await wait();
            expect(element.textContent).toEqual("transcluded content");
          });

          it("should pass the outer scope to the transclude on the isolated template async-async", async () => {
            $rootScope.val = "transcluded content";
            element = $compile(
              '<iso-async2><span ng-bind="val"></span></iso-async2>',
            )($rootScope);
            await wait();
            expect(element.textContent).toEqual("transcluded content");
          });
        });

        describe("multiple siblings receiving transclusion", () => {
          it("should only receive transclude from parent", async () => {
            module.directive("myExample", () => ({
              scope: {},
              link: function link(scope, element, attrs) {
                const foo = element.querySelector(".foo");
                scope.children = foo.children.length;
              },
              template:
                "<div>" +
                "<div>myExample {{children}}!</div>" +
                '<div ng-if="children">has children</div>' +
                '<div class="foo" ng-transclude></div>' +
                "</div>",
              transclude: true,
            }));

            initInjector("test1");
            let element = $compile("<div my-example></div>")($rootScope);
            await wait();
            expect(element.textContent).toEqual("myExample 0!");
            dealoc(element);

            element = $compile("<div my-example><p></p></div>")($rootScope);
            await wait();
            expect(element.textContent).toEqual("myExample 1!has children");
            dealoc(element);
          });
        });
      });
    });

    describe("element transclusion", () => {
      it("should support basic element transclusion", async () => {
        module.directive("trans", () => ({
          transclude: "element",
          template: "<div ng-transclude></div>",
          priority: 2,
          controller: function ($transclude) {
            this.$transclude = $transclude;
          },
          compile(element, attrs, template) {
            log.push(`compile`);
            return function (scope, element, attrs, ctrl) {
              log.push("link");
              let cursor = element;
              template(scope.$new(), (clone) => {
                cursor.after((cursor = clone));
              });
              ctrl.$transclude((clone) => {
                cursor.after(clone);
              });
            };
          },
        }));
        initInjector("test1");
        $rootScope.id = "1";
        element = $compile('<div><div trans="text">{{id}}</div></div>')(
          $rootScope,
        );
        await wait();

        expect(log.join("; ")).toEqual("compile; link");
        expect(element.textContent).not.toEqual("");
      });

      it("should only allow one element transclusion per element", () => {
        module
          .directive("first", () => ({
            transclude: "element",
            template: "<div ng-transclude></div>",
          }))
          .directive("second", () => ({
            transclude: "element",
            template: "<div ng-transclude></div>",
          }))
          .decorator("$exceptionHandler", () => {
            return (exception, cause) => {
              throw new Error(exception.message);
            };
          });
        initInjector("test1");
        expect(() => {
          $compile("<div first second></div>")($rootScope);
        }).toThrowError(/multidir/);
      });

      it("should only allow one element transclusion per element when directives have different priorities", () => {
        // we restart compilation in this case and we need to remember the duplicates during the second compile
        // regression #3893
        module
          .directive("first", () => ({
            transclude: "element",
            template: "<div ng-transclude></div>",
            priority: 100,
          }))
          .directive("second", () => ({
            transclude: "element",
            template: "<div ng-transclude></div>",
          }))
          .decorator("$exceptionHandler", () => {
            return (exception, cause) => {
              throw new Error(exception.message);
            };
          });
        initInjector("test1");
        expect(() => {
          $compile("<div first second></div>");
        }).toThrowError(/multidir/);
      });

      it("should only allow one element transclusion per element when async replace directive is in the mix", () => {
        module
          .directive("template", () => ({
            templateUrl: "template.html",
            replace: true,
          }))
          .directive("first", () => ({
            transclude: true,
            template: "<div ng-transclude></div>",
            priority: 100,
          }))
          .directive("second", () => ({
            transclude: true,
            template: "<div ng-transclude></div>",
          }));

        initInjector("test1");
        $templateCache.set("template.html", "<p second>template.html</p>");
        expect(() => {
          $compile("<div template first></div>");
        }).toThrowError(/multidir/);
      });

      it("should only allow one element transclusion per element when replace directive is in the mix", () => {
        module
          .directive("template", () => ({
            template: "<p second></p>",
            replace: true,
          }))
          .directive("first", () => ({
            transclude: true,
            template: "<div ng-transclude></div>",
            priority: 100,
          }))
          .directive("second", () => ({
            transclude: true,
            template: "<div ng-transclude></div>",
          }));
        initInjector("test1");
        expect(() => {
          $compile("<div template first></div>");
        }).toThrowError(/multidir/);
      });

      it("should support transcluded element on root content", async () => {
        let comment;
        module.directive("transclude", () => ({
          transclude: "element",
          compile(element, attr, linker) {
            return function (scope, element, attr) {
              comment = element;
            };
          },
        }));
        initInjector("test1");
        const element = $("<div>before<div transclude></div>after</div>");
        expect(element.childNodes.length).toEqual(3);
        expect(getNodeName(element.childNodes[1])).toBe("div");
        $compile(element)($rootScope);
        await wait();
        expect(getNodeName(element.childNodes[1])).toBe("#comment");
        expect(getNodeName(comment)).toBe("#comment");
      });

      it("should terminate compilation only for element transclusion", () => {
        module
          .directive("log", () => ({
            restrict: "A",
            priority: 0,
            compile: () => (scope, element, attrs) => {
              log.push(attrs.log || "LOG");
            },
          }))
          .directive("elementTrans", () => ({
            transclude: "element",
            priority: 50,
            compile: () => log.push("compile:elementTrans"),
          }))
          .directive("regularTrans", () => ({
            transclude: true,
            priority: 50,
            compile: () => log.push("compile:regularTrans"),
          }));
        initInjector("test1");
        $compile(
          '<div><div element-trans log="elem"></div><div regular-trans log="regular"></div></div>',
        )($rootScope);
        expect(log.join("; ")).toEqual(
          "compile:elementTrans; compile:regularTrans; regular",
        );
      });

      xit("should instantiate high priority controllers only once, but low priority ones each time we transclude", async () => {
        module
          .directive("elementTrans", () => ({
            transclude: true,
            priority: 50,
            controller($transclude, $element) {
              log.push("controller:elementTrans");
              $transclude((clone) => {
                $element.after(clone);
              });
              $transclude((clone) => {
                $element.after(clone);
              });
              $transclude((clone) => {
                $element.after(clone);
              });
            },
          }))
          .directive("normalDir", () => ({
            controller() {
              log.push("controller:normalDir");
            },
          }));
        bootstrap("<div><div element-trans normal-dir></div></div>", "test1");
        await wait();
        expect(log).toEqual([
          "controller:elementTrans",
          "controller:normalDir",
          "controller:normalDir",
          "controller:normalDir",
        ]);
      });

      it("should allow to access $transclude in the same directive", () => {
        let _$transclude;
        module.directive("transclude", () => ({
          transclude: "element",
          controller($transclude) {
            _$transclude = $transclude;
          },
        }));
        initInjector("test1");
        element = $compile("<div transclude></div>")($rootScope);
        expect(_$transclude).toBeDefined();
      });

      it("should copy the directive controller to all clones", () => {
        let transcludeCtrl;
        const cloneCount = 2;
        module.directive("transclude", () => ({
          transclude: "element",
          controller() {
            transcludeCtrl = this;
          },
          link(scope, el, attr, ctrl, $transclude) {
            let i;
            for (i = 0; i < cloneCount; i++) {
              $transclude(cloneAttach);
            }

            function cloneAttach(clone) {
              el.after(clone);
            }
          },
        }));
        initInjector("test1");
        element = $compile("<div><div transclude></div></div>")($rootScope);
        const children = element.childNodes;
        let i;
        for (i = 0; i < cloneCount; i++) {
          expect(getCacheData(children[i], "$transcludeController")).toEqual(
            transcludeCtrl,
          );
        }
      });

      it("should expose the directive controller to transcluded children", () => {
        let capturedTranscludeCtrl;
        module
          .directive("transclude", () => ({
            transclude: "element",
            controller() {},
            link(scope, element, attr, ctrl, $transclude) {
              $transclude(scope, (clone) => {
                element.after(clone);
              });
            },
          }))
          .directive("child", () => ({
            require: "^transclude",
            link(scope, element, attr, ctrl) {
              capturedTranscludeCtrl = ctrl;
            },
          }));
        initInjector("test1");
        // We need to wrap the transclude directive's element in a parent element so that the
        // cloned element gets deallocated/cleaned up correctly
        element = $compile(
          "<div><div transclude><div child></div></div></div>",
        )($rootScope);
        expect(capturedTranscludeCtrl).toBeTruthy();
      });

      it("should allow access to $transclude in a templateUrl directive", async () => {
        let transclude;
        module
          .directive("template", () => ({
            templateUrl: "template.html",
            replace: true,
          }))
          .directive("transclude", () => ({
            transclude: "content",
            controller($transclude) {
              transclude = $transclude;
            },
          }));
        initInjector("test1");
        $templateCache.set("template.html", "<div transclude></div>");
        element = $compile("<div template></div>")($rootScope);
        await wait();
        expect(transclude).toBeDefined();
      });

      // issue #6006
      it("should link directive with $element as a comment node", async () => {
        module
          .directive("innerAgain", () => ({
            transclude: true,
            link(scope, element, attr, controllers, transclude) {
              log.push(`innerAgain:${getNodeName(element)}`);
              transclude(scope, (clone) => {
                element.parentElement.append(clone);
              });
            },
          }))
          .directive("inner", () => ({
            replace: true,
            templateUrl: "inner.html",
            link(scope, element) {
              log.push(`inner:${getNodeName(element)}`);
            },
          }))
          .directive("outer", () => ({
            transclude: true,
            link(scope, element, attrs, controllers, transclude) {
              log.push(`outer:${getNodeName(element)}`);
              transclude(scope, (clone) => {
                element.parentElement.append(clone);
              });
            },
          }));
        initInjector("test1");

        $templateCache.set(
          "inner.html",
          "<div inner-again><p>Content</p></div>",
        );
        element = $compile("<div><div outer><div inner></div></div></div>")(
          $rootScope,
        );
        await wait();
        expect(log).toEqual(["outer:div", "innerAgain:div", "inner:div"]);
      });
    });

    it("should be possible to change the scope of a directive using $provide", async () => {
      module
        .directive("foo", () => ({
          scope: {},
          template: "<div></div>",
        }))
        .config([
          "$provide",
          function ($provide) {
            $provide.decorator("fooDirective", ($delegate) => {
              const directive = $delegate[0];
              directive.scope.something = "=";
              directive.template = "<span>{{something}}</span>";
              return $delegate;
            });
          },
        ]);

      initInjector("test1");
      element = $compile('<div><div foo something="bar"></div></div>')(
        $rootScope,
      );
      $rootScope.bar = "bar";
      await wait();
      expect(element.textContent).toBe("bar");
    });

    it("should distinguish different bindings with the same binding name", async () => {
      module.directive("foo", () => ({
        scope: {
          foo: "=",
          bar: "=",
        },
        template: "<div><div>{{foo}}</div><div>{{bar}}</div></div>",
      }));
      initInjector("test1");
      element = $compile("<div><div foo=\"'foo'\" bar=\"'bar'\"></div></div>")(
        $rootScope,
      );
      await wait();
      expect(element.textContent).toBe("foobar");
    });

    it('should safely create transclude comment node and not break with "-->"', async () => {
      // see: https://github.com/angular/angular.js/issues/1740
      element = $compile(
        "<ul><li ng-repeat=\"item in ['-->', 'x']\">{{item}}|</li></ul>",
      )($rootScope);
      await wait();
      expect(element.textContent).toBe("-->|x|");
    });

    describe("lazy compilation", () => {
      it("should pass transclusion through to template of a 'replace' directive", async () => {
        module
          .directive("transSync", () => ({
            transclude: true,
            link(scope, element, attr, ctrl, transclude) {
              expect(transclude).toEqual(jasmine.any(Function));
              transclude((child) => {
                element.append(child);
              });
            },
          }))
          .directive("trans", () => ({
            transclude: true,
            link(scope, element, attrs, ctrl, transclude) {
              // We use timeout here to simulate how ng-if works
              setTimeout(() => {
                transclude((child) => {
                  element.append(child);
                });
              });
            },
          }))
          .directive("replaceWithTemplate", () => ({
            templateUrl: "template.html",
            replace: true,
          }));

        bootstrap(
          "<div trans><div replace-with-template></div></div>",
          "test1",
        ).invoke(($templateCache) => {
          $templateCache.set(
            "template.html",
            "<div trans-sync>Content To Be Transcluded</div>",
          );
        });

        await wait(500);
        expect(ELEMENT.innerText).toEqual("Content To Be Transcluded");
      });

      it("should lazily compile the contents of directives that are transcluded", () => {
        let innerCompilationCount = 0;
        let transclude;

        module
          .directive("trans", () => ({
            transclude: true,
            controller($transclude) {
              transclude = $transclude;
            },
          }))
          .directive("inner", () => ({
            template: "<span>FooBar</span>",
            compile() {
              innerCompilationCount += 1;
            },
          }));
        initInjector("test1");
        element = $compile("<trans><inner></inner></trans>")($rootScope);
        expect(innerCompilationCount).toBe(0);
        transclude((child) => {
          element.append(child);
        });
        expect(innerCompilationCount).toBe(1);
        expect(element.textContent).toBe("FooBar");
      });

      it("should lazily compile the contents of directives that are transcluded with a template", () => {
        let innerCompilationCount = 0;
        let transclude;

        module
          .directive("trans", () => ({
            transclude: true,
            template: "<div>Baz</div>",
            controller($transclude) {
              transclude = $transclude;
            },
          }))
          .directive("inner", () => ({
            template: "<span>FooBar</span>",
            compile() {
              innerCompilationCount += 1;
            },
          }));
        initInjector("test1");
        element = $compile("<trans><inner></inner></trans>")($rootScope);
        expect(innerCompilationCount).toBe(0);
        transclude((child) => {
          element.append(child);
        });
        expect(innerCompilationCount).toBe(1);
        expect(element.textContent).toBe("BazFooBar");
      });

      it("should lazily compile the contents of directives that are transcluded with a templateUrl", async () => {
        let innerCompilationCount = 0;
        let transclude;

        module
          .directive("trans", () => ({
            transclude: true,
            templateUrl: "baz.html",
            controller($transclude) {
              transclude = $transclude;
            },
          }))
          .directive("inner", () => ({
            template: "<span>FooBar</span>",
            compile() {
              innerCompilationCount += 1;
            },
          }));
        initInjector("test1");
        $templateCache.set("baz.html", "<div>Baz</div>");
        element = $compile("<trans><inner></inner></trans>")($rootScope);
        await wait();
        expect(innerCompilationCount).toBe(0);
        transclude((child) => {
          element.append(child);
        });
        expect(innerCompilationCount).toBe(1);
        expect(element.textContent).toBe("BazFooBar");
      });

      it("should lazily compile the contents of directives that are transclude element", () => {
        let innerCompilationCount = 0;
        let transclude;

        module
          .directive("trans", () => ({
            transclude: "element",
            controller($transclude) {
              transclude = $transclude;
            },
          }))
          .directive("inner", () => ({
            template: "<span>FooBar</span>",
            compile() {
              innerCompilationCount += 1;
            },
          }));
        initInjector("test1");
        element = $compile("<div><trans><inner></inner></trans></div>")(
          $rootScope,
        );
        expect(innerCompilationCount).toBe(0);
        transclude((child) => {
          element.append(child);
        });
        expect(innerCompilationCount).toBe(1);
        expect(element.textContent).toBe("FooBar");
      });

      it("should lazily compile transcluded directives with ngIf on them", async () => {
        let innerCompilationCount = 0;
        let outerCompilationCount = 0;
        let transclude;

        module
          .directive("outer", () => ({
            transclude: true,
            compile() {
              outerCompilationCount += 1;
            },
            controller($transclude) {
              transclude = $transclude;
            },
          }))
          .directive("inner", () => ({
            template: "<span>FooBar</span>",
            compile() {
              innerCompilationCount += 1;
            },
          }));
        initInjector("test1");
        $rootScope.shouldCompile = false;

        element = $compile(
          '<div><outer ng-if="shouldCompile"><inner></inner></outer></div>',
        )($rootScope);
        await wait();
        expect(outerCompilationCount).toBe(0);
        expect(innerCompilationCount).toBe(0);
        expect(transclude).toBeUndefined();
        $rootScope.$apply("shouldCompile=true");
        await wait();
        expect(outerCompilationCount).toBe(1);
        expect(innerCompilationCount).toBe(0);
        expect(transclude).toBeDefined();
        transclude((child) => {
          element.append(child);
        });
        expect(outerCompilationCount).toBe(1);
        expect(innerCompilationCount).toBe(1);
        expect(element.textContent).toBe("FooBar");
      });

      it("should eagerly compile multiple directives with transclusion and templateUrl/replace", async () => {
        let innerCompilationCount = 0;

        module
          .directive("outer", () => ({
            transclude: true,
          }))
          .directive("outer", () => ({
            templateUrl: "inner.html",
            replace: true,
          }))
          .directive("inner", () => ({
            compile() {
              innerCompilationCount += 1;
            },
          }));
        initInjector("test1");
        $templateCache.set("inner.html", "<inner></inner>");
        element = $compile("<outer></outer>")($rootScope);
        await wait();
        expect(innerCompilationCount).toBe(1);
      });
    });
  });

  xdescribe("multi-slot transclude", () => {
    it("should only include elements without a matching transclusion element in default transclusion slot", async () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          bossSlot: "boss",
        },
        template: '<div class="other" ng-transclude></div>',
      }));
      bootstrap(
        "<minion-component>" +
          "<span>stuart</span>" +
          "<span>bob</span>" +
          "<boss>gru</boss>" +
          "<span>kevin</span>" +
          "</minion-component>",
        "test1",
      );
      await wait();
      expect(ELEMENT.textContent).toEqual("stuartbobkevin");
    });

    it("should use the default transclusion slot if the ng-transclude attribute has the same value as its key", async () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {},
        template:
          '<div class="a" ng-transclude="ng-transclude"></div>' +
          '<div class="b" ng-transclude="ng-transclude"></div>' +
          '<div class="c" data-ng-transclude="data-ng-transclude"></div>',
      }));
      initInjector("test1");
      element = $compile(
        "<minion-component>" +
          "<span>stuart</span>" +
          "<span>bob</span>" +
          "<span>kevin</span>" +
          "</minion-component>",
      )($rootScope);
      await wait();
      const a = element.firstChild;
      const b = element.children[1];
      const c = element.children[2];
      expect(a.classList.contains("a")).toBeTrue();
      expect(b.classList.contains("b")).toBeTrue();
      expect(c.classList.contains("c")).toBeTrue();
      expect(a.innerText).toEqual("stuartbobkevin");
      expect(b.innerText).toEqual("stuartbobkevin");
      expect(c.innerText).toEqual("stuartbobkevin");
    });

    it("should include non-element nodes in the default transclusion", async () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          bossSlot: "boss",
        },
        template: '<div class="other" ng-transclude></div>',
      }));
      initInjector("test1");
      element = $compile(
        "<minion-component>" +
          "text1" +
          "<span>stuart</span>" +
          "<span>bob</span>" +
          "<boss>gru</boss>" +
          "text2" +
          "<span>kevin</span>" +
          "</minion-component>",
      )($rootScope);
      await wait();
      expect(element.textContent).toEqual("text1stuartbobtext2kevin");
    });

    it("should transclude elements to an `ng-transclude` with a matching transclusion slot name", async () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          minionSlot: "minion",
          bossSlot: "boss",
        },
        template:
          '<div class="boss" ng-transclude="bossSlot"></div>' +
          '<div class="minion" ng-transclude="minionSlot"></div>' +
          '<div class="other" ng-transclude></div>',
      }));
      initInjector("test1");
      element = $compile(
        "<minion-component>" +
          "<minion>stuart</minion>" +
          "<span>dorothy</span>" +
          "<boss>gru</boss>" +
          "<minion>kevin</minion>" +
          "</minion-component>",
      )($rootScope);
      await wait();
      expect(element.firstChild.innerText).toEqual("gru");
      expect(element.children()[1].innerText).toEqual("stuartkevin");
      expect(element.children()[2].innerText).toEqual("dorothy");
    });

    it("should use the `ng-transclude-slot` attribute if ng-transclude is used as an element", async () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          minionSlot: "minion",
          bossSlot: "boss",
        },
        template:
          '<ng-transclude class="boss" ng-transclude-slot="bossSlot"></ng-transclude>' +
          '<ng-transclude class="minion" ng-transclude-slot="minionSlot"></ng-transclude>' +
          '<ng-transclude class="other"></ng-transclude>',
      }));
      initInjector("test1");
      element = $compile(
        "<minion-component>" +
          "<minion>stuart</minion>" +
          "<span>dorothy</span>" +
          "<boss>gru</boss>" +
          "<minion>kevin</minion>" +
          "</minion-component>",
      )($rootScope);
      await wait();
      expect(element.firstChild.innerText).toEqual("gru");
      expect(element.children[1].innerText).toEqual("stuartkevin");
      expect(element.children[2].innerText).toEqual("dorothy");
    });

    it("should error if a required transclude slot is not filled", () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          minionSlot: "minion",
          bossSlot: "boss",
        },
        template:
          '<div class="boss" ng-transclude="bossSlot"></div>' +
          '<div class="minion" ng-transclude="minionSlot"></div>' +
          '<div class="other" ng-transclude></div>',
      }));
      initInjector("test1");
      expect(() => {
        element = $compile(
          "<minion-component>" +
            "<minion>stuart</minion>" +
            "<span>dorothy</span>" +
            "</minion-component>",
        )($rootScope);
      }).toThrowError(/reqslot/);
    });

    it("should not error if an optional transclude slot is not filled", async () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          minionSlot: "minion",
          bossSlot: "?boss",
        },
        template:
          '<div class="boss" ng-transclude="bossSlot"></div>' +
          '<div class="minion" ng-transclude="minionSlot"></div>' +
          '<div class="other" ng-transclude></div>',
      }));
      initInjector("test1");
      element = $compile(
        "<minion-component>" +
          "<minion>stuart</minion>" +
          "<span>dorothy</span>" +
          "</minion-component>",
      )($rootScope);
      await wait();
      expect(element.children[1].innerText).toEqual("stuart");
      expect(element.children[2].innerText).toEqual("dorothy");
    });

    it("should error if we try to transclude a slot that was not declared by the directive", () => {
      module
        .directive("minionComponent", () => ({
          restrict: "E",
          scope: {},
          transclude: {
            minionSlot: "minion",
          },
          template:
            '<div class="boss" ng-transclude="bossSlot"></div>' +
            '<div class="minion" ng-transclude="minionSlot"></div>' +
            '<div class="other" ng-transclude></div>',
        }))
        .decorator("$exceptionHandler", () => {
          return (exception, cause) => {
            throw new Error(exception.message);
          };
        });
      initInjector("test1");
      expect(() => {
        element = $compile(
          "<minion-component>" +
            "<minion>stuart</minion>" +
            "<span>dorothy</span>" +
            "</minion-component>",
        )($rootScope);
      }).toThrowError(/noslot/);
    });

    it("should allow the slot name to equal the element name", async () => {
      module.directive("foo", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          bar: "bar",
        },
        template: '<div class="other" ng-transclude="bar"></div>',
      }));
      initInjector("test1");
      element = $compile("<foo><bar>baz</bar></foo>")($rootScope);
      await wait();
      expect(element.textContent).toEqual("baz");
    });

    it("should match the normalized form of the element name", async () => {
      module.directive("foo", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          fooBarSlot: "fooBar",
          mooKarSlot: "mooKar",
        },
        template:
          '<div class="a" ng-transclude="fooBarSlot"></div>' +
          '<div class="b" ng-transclude="mooKarSlot"></div>',
      }));
      initInjector("test1");
      element = $compile(
        "<foo>" +
          "<foo-bar>bar1</foo-bar>" +
          "<foo-bar>bar2</foo-bar>" +
          "<moo-kar>baz1</moo-kar>" +
          "<data-moo-kar>baz2</data-moo-kar>" +
          "</foo>",
      )($rootScope);
      await wait();
      expect(element.firstChild.innerText).toEqual("bar1bar2");
      expect(element.children[1].innerText).toEqual("baz1baz2");
    });

    it("should return true from `isSlotFilled(slotName) for slots that have content in the transclusion", async () => {
      let capturedTranscludeFn;
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          minionSlot: "minion",
          bossSlot: "?boss",
        },
        template:
          '<div class="boss" ng-transclude="bossSlot"></div>' +
          '<div class="minion" ng-transclude="minionSlot"></div>' +
          '<div class="other" ng-transclude></div>',
        link(s, e, a, c, transcludeFn) {
          capturedTranscludeFn = transcludeFn;
        },
      }));
      initInjector("test1");
      element = $compile(
        "<minion-component>" +
          "  <minion>stuart</minion>" +
          "  <minion>bob</minion>" +
          "  <span>dorothy</span>" +
          "</minion-component>",
      )($rootScope);
      await wait();

      const hasMinions = capturedTranscludeFn.isSlotFilled("minionSlot");
      const hasBosses = capturedTranscludeFn.isSlotFilled("bossSlot");

      expect(hasMinions).toBe(true);
      expect(hasBosses).toBe(false);
    });

    it("should not overwrite the contents of an `ng-transclude` element, if the matching optional slot is not filled", async () => {
      module.directive("minionComponent", () => ({
        restrict: "E",
        scope: {},
        transclude: {
          minionSlot: "minion",
          bossSlot: "?boss",
        },
        template:
          '<div class="boss" ng-transclude="bossSlot">default boss content</div>' +
          '<div class="minion" ng-transclude="minionSlot">default minion content</div>' +
          '<div class="other" ng-transclude>default content</div>',
      }));
      initInjector("test1");
      element = $compile(
        "<minion-component>" +
          "<minion>stuart</minion>" +
          "<span>dorothy</span>" +
          "<minion>kevin</minion>" +
          "</minion-component>",
      )($rootScope);
      await wait();
      expect(element.firstChild.innerText).toEqual("default boss content");
      expect(element.children[1].innerText).toEqual("stuartkevin");
      expect(element.children[2].innerText).toEqual("dorothy");
    });

    // See issue https://github.com/angular/angular.js/issues/14924
    it("should not process top-level transcluded text nodes merged into their sibling", async () => {
      module.directive("transclude", () => ({
        template: "<ng-transclude></ng-transclude>",
        transclude: {},
        scope: {},
      }));
      initInjector("test1");
      element = $("<div transclude></div>");
      element.appendChild(document.createTextNode("1{{ value }}"));
      element.appendChild(document.createTextNode("2{{ value }}"));
      element.appendChild(document.createTextNode("3{{ value }}"));

      const initialWatcherCount = $rootScope.$handler.watchers.size;
      $compile(element)($rootScope);
      $rootScope.$apply("value = 0");
      await wait();
      const newWatcherCount =
        $rootScope.$handler.watchers.size - initialWatcherCount;

      expect(element.textContent).toBe("102030");
      expect(newWatcherCount).toBe(3);
    });
  });

  ["img", "audio", "video"].forEach((tag) => {
    describe(`${tag}[src] context requirement`, () => {
      it("should NOT require trusted values for trusted URIs", async () => {
        element = $compile(`<${tag} src="{{testUrl}}"></${tag}>`)($rootScope);
        $rootScope.testUrl = "http://example.com/image.mp4"; // `http` is trusted
        await wait();
        expect(element.getAttribute("src")).toEqual(
          "http://example.com/image.mp4",
        );
      });

      it("should accept trusted values", async () => {
        // As a MEDIA_URL URL
        element = $compile(`<${tag} src="{{testUrl}}"></${tag}>`)($rootScope);
        // Some browsers complain if you try to write `javascript:` into an `img[src]`
        // So for the test use something different
        $rootScope.testUrl = $sce.trustAsMediaUrl("untrusted:foo()");
        await wait();
        expect(element.getAttribute("src")).toEqual("untrusted:foo()");

        // As a URL
        element = $compile(`<${tag} src="{{testUrl}}"></${tag}>`)($rootScope);
        await wait();
        $rootScope.testUrl = $sce.trustAsUrl("untrusted:foo()");
        expect(element.getAttribute("src")).toEqual("untrusted:foo()");

        // As a RESOURCE URL
        element = $compile(`<${tag} src="{{testUrl}}"></${tag}>`)($rootScope);
        await wait();
        $rootScope.testUrl = $sce.trustAsResourceUrl("untrusted:foo()");
        expect(element.getAttribute("src")).toEqual("untrusted:foo()");
      });
    });
  });

  ["source", "track"].forEach((tag) => {
    describe(`${tag}[src]`, () => {
      it("should NOT require trusted values for trusted URIs", async () => {
        element = $compile(
          `<video><${tag} src="{{testUrl}}"></${tag}></video>`,
        )($rootScope);
        $rootScope.testUrl = "http://example.com/image.mp4"; // `http` is trusted
        await wait();
        expect(element.querySelector(tag).getAttribute("src")).toEqual(
          "http://example.com/image.mp4",
        );
      });

      it("should accept trusted values", async () => {
        // As a MEDIA_URL URL
        element = $compile(
          `<video><${tag} src="{{testUrl}}"></${tag}></video>`,
        )($rootScope);
        $rootScope.testUrl = $sce.trustAsMediaUrl("javascript:foo()");
        await wait();
        expect(element.querySelector(tag).getAttribute("src")).toEqual(
          "javascript:foo()",
        );

        // As a URL
        element = $compile(
          `<video><${tag} src="{{testUrl}}"></${tag}></video>`,
        )($rootScope);
        $rootScope.testUrl = $sce.trustAsUrl("javascript:foo()");
        await wait();
        expect(element.querySelector(tag).getAttribute("src")).toEqual(
          "javascript:foo()",
        );

        // As a RESOURCE URL
        element = $compile(
          `<video><${tag} src="{{testUrl}}"></${tag}></video>`,
        )($rootScope);

        $rootScope.testUrl = $sce.trustAsResourceUrl("javascript:foo()");
        await wait();
        expect(element.querySelector(tag).getAttribute("src")).toEqual(
          "javascript:foo()",
        );
      });
    });
  });

  describe("img[src] sanitization", () => {
    it("should accept trusted values", async () => {
      element = $compile('<img src="{{testUrl}}"></img>')($rootScope);
      // Some browsers complain if you try to write `javascript:` into an `img[src]`
      // So for the test use something different
      $rootScope.testUrl = $sce.trustAsMediaUrl("someUntrustedThing:foo();");
      await wait();
      expect(element.getAttribute("src")).toEqual("someUntrustedThing:foo();");
    });

    it("should sanitize concatenated values even if they are trusted", async () => {
      element = $compile('<img src="{{testUrl}}ponies"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl("untrusted:foo();");
      await wait();
      expect(element.getAttribute("src")).toEqual(
        "unsafe:untrusted:foo();ponies",
      );

      element = $compile('<img src="http://{{testUrl2}}"></img>')($rootScope);
      $rootScope.testUrl2 = $sce.trustAsUrl("xyz;");
      await wait();
      expect(element.getAttribute("src")).toEqual("http://xyz;");

      element = $compile('<img src="{{testUrl3}}{{testUrl3}}"></img>')(
        $rootScope,
      );
      $rootScope.testUrl3 = $sce.trustAsUrl("untrusted:foo();");
      await wait();
      expect(element.getAttribute("src")).toEqual(
        "unsafe:untrusted:foo();untrusted:foo();",
      );
    });

    it("should not sanitize attributes other than src", async () => {
      element = $compile('<img title="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = "javascript:doEvilStuff()";
      await wait();
      expect(element.getAttribute("title")).toBe("javascript:doEvilStuff()");
    });

    it("should use $$sanitizeUri", async () => {
      const $$sanitizeUri = jasmine.createSpy("$$sanitizeUri");
      module.value("$$sanitizeUri", $$sanitizeUri);
      $$sanitizeUri.and.returnValue("someSanitizedUrl");

      initInjector("test1");
      $rootScope.testUrl = "someUrl";
      element = $compile('<img src="{{testUrl}}"></img>')($rootScope);
      await wait();
      expect(element.getAttribute("src")).toBe("someSanitizedUrl");
      expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);
    });

    it("should use $$sanitizeUri on concatenated trusted values", async () => {
      const $$sanitizeUri = jasmine
        .createSpy("$$sanitizeUri")
        .and.returnValue("someSanitizedUrl");
      module.config(($provide) => {
        $provide.value("$$sanitizeUri", $$sanitizeUri);
      });
      initInjector("test1");

      element = $compile('<img src="{{testUrl}}ponies"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl("javascript:foo();");
      await wait();
      expect(element.getAttribute("src")).toEqual("someSanitizedUrl");

      element = $compile('<img src="http://{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl("xyz");
      await wait();
      expect(element.getAttribute("src")).toEqual("someSanitizedUrl");
    });

    it("should not use $$sanitizeUri with trusted values", async () => {
      const $$sanitizeUri = jasmine
        .createSpy("$$sanitizeUri")
        .and.throwError("Should not have been called");
      module.value("$$sanitizeUri", $$sanitizeUri);
      initInjector("test1");
      element = $compile('<img src="{{testUrl}}"></img>')($rootScope);
      // Assigning javascript:foo to src makes at least IE9-11 complain, so use another
      // protocol name.
      $rootScope.testUrl = $sce.trustAsMediaUrl("untrusted:foo();");
      await wait();
      expect(element.getAttribute("src")).toEqual("untrusted:foo();");
    });
  });

  describe("img[srcset] sanitization", () => {
    it("should not error if srcset is undefined", () => {
      let linked = false;
      module.directive("setter", () => (scope, elem, attrs) => {
        // Set srcset to a value
        attrs.$set("srcset", "http://example.com/");
        expect(attrs.srcset).toBe("http://example.com/");
        // Now set it to undefined
        attrs.$set("srcset", undefined);
        expect(attrs.srcset).toBeUndefined();
        linked = true;
      });
      initInjector("test1");
      element = $compile("<img setter></img>")($rootScope);
      expect(linked).toBe(true);
      expect(element.getAttribute("srcset")).toBeNull();
    });

    it("should NOT require trusted values for trusted URI values", async () => {
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = "http://example.com/image.png"; // `http` is trusted
      await wait();
      expect(element.getAttribute("srcset")).toEqual(
        "http://example.com/image.png",
      );
    });

    it("should accept trusted values, if they are also trusted URIs", async () => {
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl("http://example.com");
      await wait();
      expect(element.getAttribute("srcset")).toEqual("http://example.com");
    });

    it("should NOT work with trusted values", async () => {
      // A limitation of the approach used for srcset is that you cannot use `trustAsUrl`.
      // Use trustAsHtml and ng-bind-html to work around this.
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl("javascript:something");
      await wait();
      expect(element.getAttribute("srcset")).toEqual(
        "unsafe:javascript:something",
      );

      element = $compile('<img srcset="{{testUrl}},{{testUrl}}"></img>')(
        $rootScope,
      );
      $rootScope.testUrl = $sce.trustAsUrl("javascript:something");
      await wait();
      expect(element.getAttribute("srcset")).toEqual(
        "unsafe:javascript:something ,unsafe:javascript:something",
      );
    });

    it("should use $$sanitizeUri", async () => {
      const $$sanitizeUri = jasmine
        .createSpy("$$sanitizeUri")
        .and.returnValue("someSanitizedUrl");
      module.config(($provide) =>
        $provide.value("$$sanitizeUri", $$sanitizeUri),
      );
      initInjector("test1");
      element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = "someUrl";
      await wait();
      expect(element.getAttribute("srcset")).toBe("someSanitizedUrl");
      expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, true);

      element = $compile('<img srcset="{{testUrl}}, {{testUrl}}"></img>')(
        $rootScope,
      );
      $rootScope.testUrl = "javascript:yay";
      await wait();
      expect(element.getAttribute("srcset")).toEqual(
        "someSanitizedUrl ,someSanitizedUrl",
      );

      element = $compile('<img srcset="java{{testUrl}}"></img>')($rootScope);
      $rootScope.testUrl = "script:yay, javascript:nay";
      await wait();
      expect(element.getAttribute("srcset")).toEqual(
        "someSanitizedUrl ,someSanitizedUrl",
      );
    });

    const testSet = {
      "http://example.com/image.png": "http://example.com/image.png",
      " http://example.com/image.png": "http://example.com/image.png",
      "http://example.com/image.png ": "http://example.com/image.png",
      "http://example.com/image.png 128w": "http://example.com/image.png 128w",
      "http://example.com/image.png 2x": "http://example.com/image.png 2x",
      "http://example.com/image.png 1.5x": "http://example.com/image.png 1.5x",
      "http://example.com/image1.png 1x,http://example.com/image2.png 2x":
        "http://example.com/image1.png 1x,http://example.com/image2.png 2x",
      "http://example.com/image1.png 1x ,http://example.com/image2.png 2x":
        "http://example.com/image1.png 1x ,http://example.com/image2.png 2x",
      "http://example.com/image1.png 1x, http://example.com/image2.png 2x":
        "http://example.com/image1.png 1x,http://example.com/image2.png 2x",
      "http://example.com/image1.png 1x , http://example.com/image2.png 2x":
        "http://example.com/image1.png 1x ,http://example.com/image2.png 2x",
      "http://example.com/image1.png 48w,http://example.com/image2.png 64w":
        "http://example.com/image1.png 48w,http://example.com/image2.png 64w",
      // Test regex to make sure doesn't mistake parts of url for width descriptors
      "http://example.com/image1.png?w=48w,http://example.com/image2.png 64w":
        "http://example.com/image1.png?w=48w,http://example.com/image2.png 64w",
      "http://example.com/image1.png 1x,http://example.com/image2.png 64w":
        "http://example.com/image1.png 1x,http://example.com/image2.png 64w",
      "http://example.com/image1.png,http://example.com/image2.png":
        "http://example.com/image1.png ,http://example.com/image2.png",
      "http://example.com/image1.png ,http://example.com/image2.png":
        "http://example.com/image1.png ,http://example.com/image2.png",
      "http://example.com/image1.png, http://example.com/image2.png":
        "http://example.com/image1.png ,http://example.com/image2.png",
      "http://example.com/image1.png , http://example.com/image2.png":
        "http://example.com/image1.png ,http://example.com/image2.png",
      "http://example.com/image1.png 1x, http://example.com/image2.png 2x, http://example.com/image3.png 3x":
        "http://example.com/image1.png 1x,http://example.com/image2.png 2x,http://example.com/image3.png 3x",
      "javascript:doEvilStuff() 2x": "unsafe:javascript:doEvilStuff() 2x",
      "http://example.com/image1.png 1x,javascript:doEvilStuff() 2x":
        "http://example.com/image1.png 1x,unsafe:javascript:doEvilStuff() 2x",
      "http://example.com/image1.jpg?x=a,b 1x,http://example.com/ima,ge2.jpg 2x":
        "http://example.com/image1.jpg?x=a,b 1x,http://example.com/ima,ge2.jpg 2x",
      // Test regex to make sure doesn't mistake parts of url for pixel density descriptors
      "http://example.com/image1.jpg?x=a2x,b 1x,http://example.com/ima,ge2.jpg 2x":
        "http://example.com/image1.jpg?x=a2x,b 1x,http://example.com/ima,ge2.jpg 2x",
    };
    Object.entries(testSet).forEach(async ([url, ref]) => {
      it("should sanitize all uris in srcset " + url, async () => {
        element = $compile('<img srcset="{{testUrl}}"></img>')($rootScope);
        $rootScope.testUrl = url;
        await wait();
        expect(element.getAttribute("srcset")).toEqual(ref);
      });
    });
  });

  describe("a[href] sanitization", () => {
    it("should NOT require trusted values for trusted URI values", async () => {
      $rootScope.testUrl = "http://example.com/image.png"; // `http` is trusted
      element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("href")).toEqual(
        "http://example.com/image.png",
      );

      element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("ng-href")).toEqual(
        "http://example.com/image.png",
      );
    });

    it("should accept trusted values for non-trusted URI values", async () => {
      $rootScope.testUrl = $sce.trustAsUrl("javascript:foo()"); // `javascript` is not trusted
      element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("href")).toEqual("javascript:foo()");

      element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("ng-href")).toEqual("javascript:foo()");
    });

    it("should sanitize non-trusted values", async () => {
      $rootScope.testUrl = "javascript:foo()"; // `javascript` is not trusted
      element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("href")).toEqual("unsafe:javascript:foo()");

      element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("href")).toEqual("unsafe:javascript:foo()");
    });

    it("should not sanitize href on elements other than anchor", async () => {
      element = $compile('<div href="{{testUrl}}"></div>')($rootScope);
      $rootScope.testUrl = "javascript:doEvilStuff()";
      await wait();

      expect(element.getAttribute("href")).toBe("javascript:doEvilStuff()");
    });

    it("should not sanitize attributes other than href/ng-href", async () => {
      element = $compile('<a title="{{testUrl}}"></a>')($rootScope);
      $rootScope.testUrl = "javascript:doEvilStuff()";
      await wait();

      expect(element.getAttribute("title")).toBe("javascript:doEvilStuff()");
    });

    it("should use $$sanitizeUri", async () => {
      const $$sanitizeUri = jasmine
        .createSpy("$$sanitizeUri")
        .and.returnValue("someSanitizedUrl");
      module.config(($provide) =>
        $provide.value("$$sanitizeUri", $$sanitizeUri),
      );
      initInjector("test1");
      element = $compile('<a href="{{testUrl}}"></a>')($rootScope);
      $rootScope.testUrl = "someUrl";
      await wait();
      expect(element.getAttribute("href")).toBe("someSanitizedUrl");
      expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);

      $$sanitizeUri.calls.reset();

      element = $compile('<a ng-href="{{testUrl}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("href")).toBe("someSanitizedUrl");
      expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
    });

    it("should use $$sanitizeUri when working with svg and xlink-href", async () => {
      const $$sanitizeUri = jasmine
        .createSpy("$$sanitizeUri")
        .and.returnValue("https://clean.example.org");
      module.config(($provide) =>
        $provide.value("$$sanitizeUri", $$sanitizeUri),
      );
      initInjector("test1");
      // This URL would fail the RESOURCE_URL trusted list, but that test shouldn't be run
      // because these interpolations will be resolved against the URL context instead
      $rootScope.testUrl = "https://bad.example.org";

      const elementA = $compile(
        "<svg><a xlink-href=\"{{ testUrl + 'aTag' }}\"></a></svg>",
      )($rootScope);
      await wait();
      expect(elementA.querySelector("a").getAttribute("xlink-href")).toBe(
        "https://clean.example.org",
      );
      expect($$sanitizeUri).toHaveBeenCalledWith(
        `${$rootScope.testUrl}aTag`,
        false,
      );

      const elementImage = $compile(
        "<svg><image xlink-href=\"{{ testUrl + 'imageTag' }}\"></image></svg>",
      )($rootScope);
      await wait();
      expect(
        elementImage.querySelector("image").getAttribute("xlink-href"),
      ).toBe("https://clean.example.org");
      expect($$sanitizeUri).toHaveBeenCalledWith(
        `${$rootScope.testUrl}imageTag`,
        true,
      );
    });

    it("should use $$sanitizeUri when working with svg and href through ng-href", async () => {
      const $$sanitizeUri = jasmine
        .createSpy("$$sanitizeUri")
        .and.returnValue("https://clean.example.org");
      module.config(($provide) =>
        $provide.value("$$sanitizeUri", $$sanitizeUri),
      );
      initInjector("test1");
      // This URL would fail the RESOURCE_URL trusted list, but that test shouldn't be run
      // because these interpolations will be resolved against the URL context instead
      $rootScope.testUrl = "https://bad.example.org";

      element = $compile('<svg><a href="" ng-href="{{ testUrl }}"></a></svg>')(
        $rootScope,
      );
      await wait();
      expect(element.querySelector("a").href.baseVal).toBe(
        "https://clean.example.org",
      );
      expect($$sanitizeUri).toHaveBeenCalledWith($rootScope.testUrl, false);
    });

    it("should require a RESOURCE_URL context for href by if not on an anchor or image", async () => {
      let error = [];
      module.decorator("$exceptionHandler", () => {
        return (exception, cause) => {
          error.push(exception.message);
        };
      });
      initInjector("test1");
      element = $compile(
        '<svg><whatever xlink-href="{{ testUrl }}"></whatever></svg>',
      )($rootScope);
      $rootScope.testUrl = "https://bad.example.org";
      await wait();
      expect(error[0]).toMatch(/insecurl/);
    });
  });

  describe("interpolation on HTML DOM event handler attributes onclick, onXYZ, formaction", () => {
    it("should disallow interpolation on onclick", () => {
      module.decorator("$exceptionHandler", () => {
        return (exception, cause) => {
          throw new Error(exception.message);
        };
      });
      initInjector("test1");
      // All interpolations are disallowed.
      $rootScope.onClickJs = "";
      expect(() => {
        $compile('<button onclick="{{onClickJs}}"></button>');
      }).toThrowError(/nodomevents/);
      expect(() => {
        $compile('<button ONCLICK="{{onClickJs}}"></button>');
      }).toThrowError(/nodomevents/);
      expect(() => {
        $compile('<button ng-attr-onclick="{{onClickJs}}"></button>');
      }).toThrowError(/nodomevents/);
      expect(() => {
        $compile('<button ng-attr-ONCLICK="{{onClickJs}}"></button>');
      }).toThrowError(/nodomevents/);
    });

    it("should pass through arbitrary values on onXYZ event attributes that contain a hyphen", async () => {
      element = $compile('<button on-click="{{onClickJs}}"></button>')(
        $rootScope,
      );
      $rootScope.onClickJs = "javascript:doSomething()";
      await wait();
      expect(element.getAttribute("on-click")).toEqual(
        "javascript:doSomething()",
      );
    });

    it('should pass through arbitrary values on "on" and "data-on" attributes', async () => {
      element = $compile('<button data-on="{{dataOnVar}}"></button>')(
        $rootScope,
      );
      $rootScope.dataOnVar = "data-on text";
      await wait();
      expect(element.getAttribute("data-on")).toEqual("data-on text");

      element = $compile('<button on="{{onVar}}"></button>')($rootScope);
      $rootScope.onVar = "on text";
      await wait();
      expect(element.getAttribute("on")).toEqual("on text");
    });
  });

  describe("iframe[src]", () => {
    let errors = [];
    beforeEach(() => {
      errors = [];
      module.decorator("$exceptionHandler", () => {
        return (exception, cause) => {
          errors.push(exception.message);
        };
      });
      initInjector("test1");
    });

    it("should pass through src attributes for the same domain", async () => {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = "different_page";
      await wait();
      expect(element.getAttribute("src")).toEqual("different_page");
    });

    it("should clear out src attributes for a different domain", async () => {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = "http://a.different.domain.example.com";
      await wait();
      expect(errors[0]).toMatch(/insecurl/);
    });

    it("should clear out JS src attributes", async () => {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = "javascript:alert(1);";
      await wait();
      expect(errors[0]).toMatch(/insecurl/);
    });

    it("should clear out non-resource_url src attributes", async () => {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl("javascript:doTrustedStuff()");
      await wait();
      expect(errors[0]).toMatch(/insecurl/);
    });

    it("should pass through $sce.trustAs() values in src attributes", async () => {
      element = $compile('<iframe src="{{testUrl}}"></iframe>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl(
        "javascript:doTrustedStuff()",
      );
      await wait();

      expect(element.getAttribute("src")).toEqual(
        "javascript:doTrustedStuff()",
      );
    });
  });

  describe("base[href]", () => {
    it("should be a RESOURCE_URL context", async () => {
      let error = [];
      module.decorator("$exceptionHandler", () => {
        return (exception, cause) => {
          error.push(exception.message);
        };
      });
      initInjector("test1");
      element = $compile('<base href="{{testUrl}}"/>')($rootScope);

      $rootScope.testUrl = $sce.trustAsResourceUrl("https://example.com/");
      await wait();
      expect(element.getAttribute("href")).toContain("https://example.com/");

      $rootScope.testUrl = "https://not.example.com/";
      await wait();
      expect(error[0]).toMatch(/insecurl/);
    });
  });

  describe("form[action]", () => {
    let error = [];
    beforeEach(() => {
      error = [];
      module.decorator("$exceptionHandler", () => {
        return (exception, cause) => {
          error.push(exception.message);
        };
      });
      initInjector("test1");
    });

    it("should pass through action attribute for the same domain", async () => {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = "different_page";
      await wait();
      expect(element.getAttribute("action")).toEqual("different_page");
    });

    it("should clear out action attribute for a different domain", async () => {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = "http://a.different.domain.example.com";
      await wait();
      expect(error[0]).toMatch(/insecurl/);
    });

    it("should clear out JS action attribute", async () => {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = "javascript:alert(1);";
      await wait();
      expect(error[0]).toMatch(/insecurl/);
    });

    it("should clear out non-resource_url action attribute", async () => {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = $sce.trustAsUrl("javascript:doTrustedStuff()");
      await wait();
      expect(error[0]).toMatch(/insecurl/);
    });

    it("should pass through $sce.trustAsResourceUrl() values in action attribute", async () => {
      element = $compile('<form action="{{testUrl}}"></form>')($rootScope);
      $rootScope.testUrl = $sce.trustAsResourceUrl(
        "javascript:doTrustedStuff()",
      );
      await wait();

      expect(element.getAttribute("action")).toEqual(
        "javascript:doTrustedStuff()",
      );
    });
  });

  describe("link[href]", () => {
    let error = [];
    beforeEach(() => {
      error = [];
      module.decorator("$exceptionHandler", () => {
        return (exception, cause) => {
          error.push(exception.message);
        };
      });
      initInjector("test1");
    });

    it("should reject invalid RESOURCE_URLs", async () => {
      $rootScope.testUrl = "https://evil.example.org/css.css";
      element = $compile('<link href="{{testUrl}}" rel="stylesheet" />')(
        $rootScope,
      );
      await wait();
      expect(error[0]).toMatch(/insecurl/);
    });

    it("should accept valid RESOURCE_URLs", async () => {
      element = $compile('<link href="{{testUrl}}" rel="stylesheet" />')(
        $rootScope,
      );

      $rootScope.testUrl = "./css1.css";
      await wait();
      expect(element.getAttribute("href")).toContain("css1.css");

      $rootScope.testUrl = $sce.trustAsResourceUrl(
        "https://elsewhere.example.org/css2.css",
      );
      await wait();
      expect(element.getAttribute("href")).toContain(
        "https://elsewhere.example.org/css2.css",
      );
    });

    it("should accept valid constants", async () => {
      element = $compile(
        '<link href="https://elsewhere.example.org/css2.css" rel="stylesheet" />',
      )($rootScope);

      await wait();
      expect(element.getAttribute("href")).toContain(
        "https://elsewhere.example.org/css2.css",
      );
    });
  });

  describe("ngAttr* attribute binding", () => {
    it("should bind after digest but not before", async () => {
      $rootScope.name = "Misko";
      element = $compile('<span ng-attr-test="{{name}}"></span>')($rootScope);
      expect(element.getAttribute("test")).toBeNull();
      await wait();
      expect(element.getAttribute("test")).toBe("Misko");
    });

    it("should bind after digest but not before when after overridden attribute", async () => {
      $rootScope.name = "Misko";
      element = $compile('<span test="123" ng-attr-test="{{name}}"></span>')(
        $rootScope,
      );
      expect(element.getAttribute("test")).toBe("123");
      await wait();
      expect(element.getAttribute("test")).toBe("Misko");
    });

    it("should bind after digest but not before when before overridden attribute", async () => {
      $rootScope.name = "Misko";
      element = $compile('<span ng-attr-test="{{name}}" test="123"></span>')(
        $rootScope,
      );
      expect(element.getAttribute("test")).toBe("123");
      await wait();
      expect(element.getAttribute("test")).toBe("Misko");
    });

    it("should set the attribute (after digest) even if there is no interpolation", () => {
      element = $compile('<span ng-attr-test="foo"></span>')($rootScope);
      expect(element.getAttribute("test")).toBe("foo");
    });

    it("should remove attribute if any bindings are undefined", async () => {
      element = $compile('<span ng-attr-test="{{name}}{{emphasis}}"></span>')(
        $rootScope,
      );

      expect(element.getAttribute("test")).toBeNull();
      $rootScope.name = "caitp";
      expect(element.getAttribute("test")).toBeNull();
      $rootScope.emphasis = "!!!";
      await wait();
      expect(element.getAttribute("test")).toBe("caitp!!!");
    });

    describe("in directive", () => {
      beforeEach(() => {
        module
          .directive("syncTest", () => ({
            link: {
              pre(s, e, attr) {
                log.push(attr.test);
              },
              post(s, e, attr) {
                log.push(attr.test);
              },
            },
          }))
          .directive("asyncTest", () => ({
            templateUrl: "async.html",
            link: {
              pre(s, e, attr) {
                log.push(attr.test);
              },
              post(s, e, attr) {
                log.push(attr.test);
              },
            },
          }));
        initInjector("test1");
        $templateCache.set("async.html", "<h1>Test</h1>");
      });

      it("should provide post-digest value in synchronous directive link functions when after overridden attribute", () => {
        $rootScope.test = "TEST";
        element = $compile(
          '<div sync-test test="123" ng-attr-test="{{test}}"></div>',
        )($rootScope);
        expect(element.getAttribute("test")).toBe("123");
        expect(log).toEqual(["TEST", "TEST"]);
      });

      it("should provide post-digest value in synchronous directive link functions when before overridden attribute", () => {
        $rootScope.test = "TEST";
        element = $compile(
          '<div sync-test ng-attr-test="{{test}}" test="123"></div>',
        )($rootScope);
        expect(element.getAttribute("test")).toBe("123");
        expect(log).toEqual(["TEST", "TEST"]);
      });

      it("should provide post-digest value in asynchronous directive link functions when after overridden attribute", async () => {
        $rootScope.test = "TEST";
        element = $compile(
          '<div async-test test="123" ng-attr-test="{{test}}"></div>',
        )($rootScope);
        expect(element.getAttribute("test")).toBe("123");

        await wait();
        expect(element.getAttribute("test")).toBe("TEST");
        expect(log).toEqual(["TEST", "TEST"]);
      });

      it("should provide post-digest value in asynchronous directive link functions when before overridden attribute", async () => {
        $rootScope.test = "TEST";
        element = $compile(
          '<div async-test ng-attr-test="{{test}}" test="123"></div>',
        )($rootScope);

        await wait();
        expect(element.getAttribute("test")).toBe("TEST");
        expect(log).toEqual(["TEST", "TEST"]);
      });
    });

    it("should work with different prefixes", async () => {
      $rootScope.name = "Misko";
      element = $compile(
        '<span ng-attr-test="{{name}}" ng-Attr-test2="{{name}}" ng-Attr-test3="{{name}}"></span>',
      )($rootScope);
      expect(element.getAttribute("test")).toBeNull();
      expect(element.getAttribute("test2")).toBeNull();
      expect(element.getAttribute("test3")).toBeNull();

      await wait();
      expect(element.getAttribute("test")).toBe("Misko");
      expect(element.getAttribute("test2")).toBe("Misko");
      expect(element.getAttribute("test3")).toBe("Misko");
    });

    it("should use the non-prefixed name in $attr mappings", async () => {
      let attrs;
      module.directive("attrExposer", () => ({
        link($scope, $element, $attrs) {
          attrs = $attrs;
        },
      }));
      initInjector("test1");

      $compile(
        '<div attr-exposer ng-attr-title="12" ng-attr-super-title="34" ng-attr-my-camel_title="56">',
      )($rootScope);
      await wait();

      expect(attrs.title).toBe("12");
      expect(attrs.$attr.title).toBe("title");
      expect(attrs.ngAttrTitle).toBeUndefined();
      expect(attrs.$attr.ngAttrTitle).toBeUndefined();

      expect(attrs.superTitle).toBe("34");
      expect(attrs.$attr.superTitle).toBe("super-title");
      expect(attrs.ngAttrSuperTitle).toBeUndefined();
      expect(attrs.$attr.ngAttrSuperTitle).toBeUndefined();

      // Note the casing is incorrect: https://github.com/angular/angular.js/issues/16624
      expect(attrs.myCameltitle).toBe("56");
      expect(attrs.$attr.myCameltitle).toBe("my-camelTitle");
      expect(attrs.ngAttrMyCameltitle).toBeUndefined();
      expect(attrs.ngAttrMyCamelTitle).toBeUndefined();
      expect(attrs.$attr.ngAttrMyCameltitle).toBeUndefined();
      expect(attrs.$attr.ngAttrMyCamelTitle).toBeUndefined();
    });

    it('should work with the "href" attribute', async () => {
      $rootScope.value = "test";
      element = $compile('<a ng-attr-href="test/{{value}}"></a>')($rootScope);
      await wait();
      expect(element.getAttribute("href")).toBe("test/test");
    });

    it("should work if they are prefixed with data- and different prefixes", async () => {
      $rootScope.name = "Misko";
      element = $compile(
        '<span data-ng-attr-test2="{{name}}" ng-attr-test3="{{name}}" data-ng-attr-test4="{{name}}" ' +
          'ng-attr-test5="{{name}}" ng-attr-test6="{{name}}"></span>',
      )($rootScope);

      expect(element.getAttribute("test2")).toBeNull();
      expect(element.getAttribute("test3")).toBeNull();
      expect(element.getAttribute("test4")).toBeNull();
      expect(element.getAttribute("test5")).toBeNull();
      expect(element.getAttribute("test6")).toBeNull();

      await wait();
      expect(element.getAttribute("test2")).toBe("Misko");
      expect(element.getAttribute("test3")).toBe("Misko");
      expect(element.getAttribute("test4")).toBe("Misko");
      expect(element.getAttribute("test5")).toBe("Misko");
      expect(element.getAttribute("test6")).toBe("Misko");
    });

    describe("with media url attributes", () => {
      it("should work with interpolated ng-attr-src", async () => {
        $rootScope.name = "some-image.png";
        element = $compile('<img ng-attr-src="{{name}}">')($rootScope);
        expect(element.getAttribute("src")).toBeNull();
        await wait();
        expect(element.getAttribute("src")).toBe("some-image.png");

        $rootScope.name = "other-image.png";
        await wait();
        expect(element.getAttribute("src")).toBe("other-image.png");
      });

      it("should work with interpolated ng-attr-data-src", async () => {
        $rootScope.name = "some-image.png";
        element = $compile('<img ng-attr-data-src="{{name}}">')($rootScope);
        expect(element.getAttribute("data-src")).toBeNull();
        await wait();
        expect(element.getAttribute("data-src")).toBe("some-image.png");

        $rootScope.name = "other-image.png";
        await wait();
        expect(element.getAttribute("data-src")).toBe("other-image.png");
      });

      it("should work alongside constant [src]-attribute and [ng-attr-data-src] attributes", async () => {
        $rootScope.name = "some-image.png";
        element = $compile(
          '<img src="constant.png" ng-attr-data-src="{{name}}">',
        )($rootScope);
        expect(element.getAttribute("data-src")).toBeNull();

        await wait();
        expect(element.getAttribute("src")).toBe("constant.png");
        expect(element.getAttribute("data-src")).toBe("some-image.png");

        $rootScope.name = "other-image.png";
        await wait();
        expect(element.getAttribute("src")).toBe("constant.png");
        expect(element.getAttribute("data-src")).toBe("other-image.png");
      });
    });

    describe("when an attribute has a dash-separated name", () => {
      it("should work with different prefixes", async () => {
        $rootScope.name = "JamieMason";
        element = $compile(
          '<span ng-attr-dash-test="{{name}}" ng-Attr-dash-test2="{{name}}" ng-Attr-dash-test3="{{name}}"></span>',
        )($rootScope);
        expect(element.getAttribute("dash-test")).toBeNull();
        expect(element.getAttribute("dash-test2")).toBeNull();
        expect(element.getAttribute("dash-test3")).toBeNull();
        await wait();
        expect(element.getAttribute("dash-test")).toBe("JamieMason");
        expect(element.getAttribute("dash-test2")).toBe("JamieMason");
        expect(element.getAttribute("dash-test3")).toBe("JamieMason");
      });

      it("should work if they are prefixed with  or data-", async () => {
        $rootScope.name = "JamieMason";
        element = $compile(
          '<span data-ng-attr-dash-test2="{{name}}" ng-attr-dash-test3="{{name}}" data-ng-attr-dash-test4="{{name}}"></span>',
        )($rootScope);
        expect(element.getAttribute("dash-test2")).toBeNull();
        expect(element.getAttribute("dash-test3")).toBeNull();
        expect(element.getAttribute("dash-test4")).toBeNull();

        await wait();
        expect(element.getAttribute("dash-test2")).toBe("JamieMason");
        expect(element.getAttribute("dash-test3")).toBe("JamieMason");
        expect(element.getAttribute("dash-test4")).toBe("JamieMason");
      });

      it("should keep attributes ending with -end single-element directives", () => {
        module.directive("dashEnder", () => ({
          link(scope, element, attrs) {
            log.push(attrs.onDashEnd);
          },
        }));
        initInjector("test1");
        $compile('<span data-dash-ender data-on-dash-end="ender"></span>')(
          $rootScope,
        );
        expect(log[0]).toEqual("ender");
      });
    });
  });

  describe("addPropertySecurityContext", () => {
    it("should allow adding new properties", () => {
      createInjector([
        "ng",
        ($compileProvider) => {
          $compileProvider.addPropertySecurityContext(
            "div",
            "title",
            "mediaUrl",
          );
          $compileProvider.addPropertySecurityContext(
            "*",
            "my-prop",
            "resourceUrl",
          );
        },
      ]);
      expect(true).toBeTrue();
    });

    it("should allow different sce types of a property on different element types", () => {
      createInjector([
        "ng",
        ($compileProvider) => {
          $compileProvider.addPropertySecurityContext(
            "div",
            "title",
            "mediaUrl",
          );
          $compileProvider.addPropertySecurityContext("span", "title", "css");
          $compileProvider.addPropertySecurityContext(
            "*",
            "title",
            "resourceUrl",
          );
          $compileProvider.addPropertySecurityContext(
            "article",
            "title",
            "html",
          );
        },
      ]);
      expect(true).toBeTrue();
    });

    it("should throw 'ctxoverride' when changing an existing context", () => {
      createInjector([
        "ng",
        ($compileProvider) => {
          $compileProvider.addPropertySecurityContext(
            "div",
            "title",
            "mediaUrl",
          );
          expect(() => {
            $compileProvider.addPropertySecurityContext(
              "div",
              "title",
              "resourceUrl",
            );
          }).toThrowError(/ctxoverride/);
        },
      ]);
    });

    it("should allow setting the same property/element to the same value", () => {
      createInjector([
        "ng",
        ($compileProvider) => {
          $compileProvider.addPropertySecurityContext(
            "div",
            "title",
            "mediaUrl",
          );
          $compileProvider.addPropertySecurityContext(
            "div",
            "title",
            "mediaUrl",
          );
        },
      ]);
      expect(true).toBeTrue();
    });

    it("should enforce the specified sce type for properties added for specific elements", async () => {
      injector = createInjector([
        "ng",
        "defaultModule",
        ($compileProvider) => {
          $compileProvider.addPropertySecurityContext("div", "foo", "mediaUrl");
        },
      ]);
      reloadInjector();

      const element = $compile('<div ng-prop-foo="bar"></div>')($rootScope);

      $rootScope.bar = "untrusted:test1";
      await wait();
      expect(element.foo).toBe("unsafe:untrusted:test1");
      $rootScope.bar = $sce.trustAsCss("untrusted:test2");
      await wait();

      expect(element.foo).toBe("unsafe:untrusted:test2");

      $rootScope.bar = $sce.trustAsMediaUrl("untrusted:test3");
      await wait();
      expect(element.foo).toBe("untrusted:test3");
    });

    it("should enforce the specified sce type for properties added for all elements (*)", async () => {
      injector = createInjector([
        "ng",
        "defaultModule",
        ($compileProvider) => {
          $compileProvider.addPropertySecurityContext("*", "foo", "mediaUrl");
        },
      ]);
      reloadInjector();

      const element = $compile('<div ng-prop-foo="bar"></div>')($rootScope);

      $rootScope.bar = "untrusted:test1";
      await wait();
      expect(element.foo).toBe("unsafe:untrusted:test1");

      $rootScope.bar = $sce.trustAsCss("untrusted:test2");
      await wait();
      expect(element.foo).toBe("unsafe:untrusted:test2");

      $rootScope.bar = $sce.trustAsMediaUrl("untrusted:test3");
      await wait();
      expect(element.foo).toBe("untrusted:test3");
    });

    it("should enforce the specific sce type when both an element specific and generic exist", async () => {
      injector = createInjector([
        "ng",
        "defaultModule",
        ($compileProvider) => {
          $compileProvider.addPropertySecurityContext("*", "foo", "css");
          $compileProvider.addPropertySecurityContext("div", "foo", "mediaUrl");
        },
      ]);
      reloadInjector();

      const element = $compile('<div ng-prop-foo="bar"></div>')($rootScope);

      $rootScope.bar = "untrusted:test1";
      await wait();
      expect(element.foo).toBe("unsafe:untrusted:test1");

      $rootScope.bar = $sce.trustAsCss("untrusted:test2");
      await wait();
      expect(element.foo).toBe("unsafe:untrusted:test2");

      $rootScope.bar = $sce.trustAsMediaUrl("untrusted:test3");
      await wait();
      expect(element.foo).toBe("untrusted:test3");
    });
  });

  describe("when an attribute has an underscore-separated name", () => {
    it("should work with different prefixes", async () => {
      $rootScope.dimensions = "0 0 0 0";
      element = $compile('<svg ng-attr-view-box="{{dimensions}}"></svg>')(
        $rootScope,
      );
      expect(element.getAttribute("view-box")).toBeNull();
      await wait();
      expect(element.getAttribute("view-box")).toBe("0 0 0 0");
    });

    it("should work if they are prefixed with data-", async () => {
      $rootScope.dimensions = "0 0 0 0";
      $rootScope.number = 0.42;
      $rootScope.scale = 1;
      element = $compile(
        '<svg data-ng-attr-view-box="{{dimensions}}">' +
          '<filter ng-attr-filter-units="{{number}}">' +
          '<feDiffuseLighting data-ng-attr-surface-scale="{{scale}}">' +
          "</feDiffuseLighting>" +
          '<feSpecularLighting ng-attr-surface-scale="{{scale}}">' +
          "</feSpecularLighting></filter></svg>",
      )($rootScope);
      expect(element.getAttribute("viewBox")).toBeNull();
      await wait();
      expect(element.getAttribute("view-box")).toBe("0 0 0 0");
      expect(element.querySelector("filter").getAttribute("filter-units")).toBe(
        "0.42",
      );
      expect(
        element
          .querySelector("feDiffuseLighting")
          .getAttribute("surface-scale"),
      ).toBe("1");
      expect(
        element
          .querySelector("feSpecularLighting")
          .getAttribute("surface-scale"),
      ).toBe("1");
    });
  });

  // TODO ANIMATIONS
  // describe("$animate animation hooks", () => {
  //   beforeEach(module("ngAnimateMock"));

  //   it("should automatically fire the addClass and removeClass animation hooks", () => {
  //     let data;
  //     const element = ('<div class="{{val1}} {{val2}} fire"></div>');
  //     $compile(element)($rootScope);

  //     ;

  //     expect(element.classList.contains("fire")).toBe(true);

  //     $rootScope.val1 = "ice";
  //     $rootScope.val2 = "rice";
  //     ;

  //     data = $animate.queue.shift();
  //     expect(data.event).toBe("addClass");
  //     expect(data.args[1]).toBe("ice rice");

  //     expect(element.classList.contains("ice")).toBe(true);
  //     expect(element.classList.contains("rice")).toBe(true);
  //     expect(element.classList.contains("fire")).toBe(true);

  //     $rootScope.val2 = "dice";
  //     ;

  //     data = $animate.queue.shift();
  //     expect(data.event).toBe("addClass");
  //     expect(data.args[1]).toBe("dice");

  //     data = $animate.queue.shift();
  //     expect(data.event).toBe("removeClass");
  //     expect(data.args[1]).toBe("rice");

  //     expect(element.classList.contains("ice")).toBe(true);
  //     expect(element.classList.contains("dice")).toBe(true);
  //     expect(element.classList.contains("fire")).toBe(true);

  //     $rootScope.val1 = "";
  //     $rootScope.val2 = "";
  //     ;

  //     data = $animate.queue.shift();
  //     expect(data.event).toBe("removeClass");
  //     expect(data.args[1]).toBe("ice dice");

  //     expect(element.classList.contains("ice")).toBe(false);
  //     expect(element.classList.contains("dice")).toBe(false);
  //     expect(element.classList.contains(ist.contains("fire")).toBe(true);
  //   });
  // });

  describe("component helper", () => {
    it("should return the module", () => {
      const myModule = module;
      expect(myModule.component("myComponent", {})).toBe(myModule);
      expect(myModule.component({})).toBe(myModule);
    });

    it("should register a directive", () => {
      module.component("myComponent", {
        template: "<div>SUCCESS</div>",
        controller() {
          log.push("OK");
        },
      });
      initInjector("test1");
      element = $compile("<my-component></my-component>")($rootScope);
      expect(element.children[0].innerText).toEqual("SUCCESS");
      expect(log[0]).toEqual("OK");
    });

    it("should register multiple directives when object passed as first parameter", async () => {
      module.component({
        fooComponent: {
          template: "<div>FOO SUCCESS</div>",
          controller() {
            log.push("FOO:OK");
          },
        },
        barComponent: {
          template: "<div>BAR SUCCESS</div>",
          controller() {
            log.push("BAR:OK");
          },
        },
      });
      initInjector("test1");
      const fooElement = $compile("<foo-component></foo-component>")(
        $rootScope,
      );
      const barElement = $compile("<bar-component></bar-component>")(
        $rootScope,
      );
      await wait();
      expect(fooElement.children[0].innerText).toEqual("FOO SUCCESS");
      expect(barElement.children[0].innerText).toEqual("BAR SUCCESS");
      expect(log.join("")).toEqual("FOO:OKBAR:OK");
    });

    it("should register a directive via $compileProvider.component()", () => {
      module.component("myComponent", {
        template: "<div>SUCCESS</div>",
        controller() {
          log.push("OK");
        },
      });
      initInjector("test1");
      element = $compile("<my-component></my-component>")($rootScope);
      expect(element.children[0].innerText).toEqual("SUCCESS");
      expect(log[0]).toEqual("OK");
    });

    it("should add additional annotations to directive factory", () => {
      const myModule = module.component("myComponent", {
        $canActivate: "canActivate",
        $routeConfig: "routeConfig",
        $customAnnotation: "XXX",
      });
      initInjector("test1");
      expect(myModule.invokeQueue.pop().pop()[1]).toEqual(
        jasmine.objectContaining({
          $canActivate: "canActivate",
          $routeConfig: "routeConfig",
          $customAnnotation: "XXX",
        }),
      );
    });

    it("should expose additional annotations on the directive definition object", () => {
      module.component("myComponent", {
        $canActivate: "canActivate",
        $routeConfig: "routeConfig",
        $customAnnotation: "XXX",
      });

      initInjector("test1");
      let myComponentDirective = injector.get("myComponentDirective");
      expect(myComponentDirective[0]).toEqual(
        jasmine.objectContaining({
          $canActivate: "canActivate",
          $routeConfig: "routeConfig",
          $customAnnotation: "XXX",
        }),
      );
    });

    it("should support custom annotations if the controller is named", () => {
      module.component("myComponent", {
        $customAnnotation: "XXX",
        controller: "SomeNamedController",
      });
      initInjector("test1");
      let myComponentDirective = injector.get("myComponentDirective");
      expect(myComponentDirective[0]).toEqual(
        jasmine.objectContaining({
          $customAnnotation: "XXX",
        }),
      );
    });

    it("should provide a new empty controller if none is specified", () => {
      module
        .component("myComponent1", { $customAnnotation1: "XXX" })
        .component("myComponent2", { $customAnnotation2: "YYY" });

      initInjector("test1");
      let myComponent1Directive = injector.get("myComponent1Directive");
      let myComponent2Directive = injector.get("myComponent2Directive");

      const ctrl1 = myComponent1Directive[0].controller;
      const ctrl2 = myComponent2Directive[0].controller;

      expect(ctrl1).not.toBe(ctrl2);
      expect(ctrl1.$customAnnotation1).toBe("XXX");
      expect(ctrl1.$customAnnotation2).toBeUndefined();
      expect(ctrl2.$customAnnotation1).toBeUndefined();
      expect(ctrl2.$customAnnotation2).toBe("YYY");
    });

    it("should return ddo with reasonable defaults", () => {
      module.component("myComponent", {});
      initInjector("test1");

      let myComponentDirective = injector.get("myComponentDirective");
      expect(myComponentDirective[0]).toEqual(
        jasmine.objectContaining({
          controller: jasmine.any(Function),
          controllerAs: "$ctrl",
          template: "",
          templateUrl: undefined,
          transclude: undefined,
          scope: {},
          bindToController: {},
          restrict: "E",
        }),
      );
    });

    it("should return ddo with assigned options", () => {
      function myCtrl() {}
      module.component("myComponent", {
        controller: myCtrl,
        controllerAs: "ctrl",
        template: "abc",
        templateUrl: "def.html",
        transclude: true,
        bindings: { abc: "=" },
      });
      initInjector("test1");
      let myComponentDirective = injector.get("myComponentDirective");

      expect(myComponentDirective[0]).toEqual(
        jasmine.objectContaining({
          controller: myCtrl,
          controllerAs: "ctrl",
          template: "abc",
          templateUrl: "def.html",
          transclude: true,
          scope: {},
          bindToController: { abc: "=" },
          restrict: "E",
        }),
      );
    });

    it("should allow passing injectable functions as template/templateUrl", () => {
      module
        .component("myComponent", {
          template($element, $attrs, myValue) {
            log.push(`template,${$element},${$attrs},${myValue}\n`);
          },
          templateUrl($element, $attrs, myValue) {
            log.push(`templateUrl,${$element},${$attrs},${myValue}\n`);
          },
        })
        .value("myValue", "blah");
      initInjector("test1");
      let myComponentDirective = injector.get("myComponentDirective");
      myComponentDirective[0].template("a", "b");
      myComponentDirective[0].templateUrl("c", "d");
      expect(log.join("")).toEqual("template,a,b,blah\ntemplateUrl,c,d,blah\n");
    });

    it("should allow passing injectable arrays as template/templateUrl", () => {
      module
        .component("myComponent", {
          template: [
            "$element",
            "$attrs",
            "myValue",
            function ($element, $attrs, myValue) {
              log.push(`template,${$element},${$attrs},${myValue}\n`);
            },
          ],
          templateUrl: [
            "$element",
            "$attrs",
            "myValue",
            function ($element, $attrs, myValue) {
              log.push(`templateUrl,${$element},${$attrs},${myValue}\n`);
            },
          ],
        })
        .value("myValue", "blah");
      initInjector("test1");
      let myComponentDirective = injector.get("myComponentDirective");
      myComponentDirective[0].template("a", "b");
      myComponentDirective[0].templateUrl("c", "d");
      expect(log.join("")).toEqual("template,a,b,blah\ntemplateUrl,c,d,blah\n");
    });

    it("should allow passing transclude as object", () => {
      module.component("myComponent", {
        transclude: {},
      });
      initInjector("test1");
      let myComponentDirective = injector.get("myComponentDirective");
      expect(myComponentDirective[0]).toEqual(
        jasmine.objectContaining({
          transclude: {},
        }),
      );
    });

    it("should give ctrl as syntax priority over controllerAs", () => {
      module.component("myComponent", {
        controller: "MyCtrl as vm",
      });
      initInjector("test1");
      let myComponentDirective = injector.get("myComponentDirective");
      expect(myComponentDirective[0]).toEqual(
        jasmine.objectContaining({
          controllerAs: "vm",
        }),
      );
    });
  });
});
