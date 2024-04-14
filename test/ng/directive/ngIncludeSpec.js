import { dealoc, jqLite } from "../../../src/jqLite";
import { Angular } from "../../../src/loader";
import { createInjector } from "../../../src/injector";
import { publishExternalAPI } from "../../../src/public";
import { valueFn } from "../../../src/ng/utils";

describe("ngInclude", () => {
  describe("basic", () => {
    let element;
    let $rootScope;
    let $templateCache;
    let $compile;
    let module;
    let injector;
    let angular;

    beforeEach(() => {
      delete window.angular;
      angular = new Angular();
      publishExternalAPI().decorator("$exceptionHandler", function () {
        return (exception, cause) => {
          throw new Error(exception.message);
        };
      });
      // module = window.angular.module("myModule", []);
      injector = createInjector(["ng"]);
      $rootScope = injector.get("$rootScope");
      $templateCache = injector.get("$templateCache");
      $compile = injector.get("$compile");
    });

    afterEach(() => {
      dealoc(element);
    });

    it("should trust and use literal urls", (done) => {
      const element = jqLite(
        "<div><div ng-include=\"'/test.html'\"></div></div>",
      );
      const injector = angular.bootstrap(element);
      $rootScope = injector.get("$rootScope");
      $rootScope.$digest();
      setTimeout(() => {
        expect(element.text()).toEqual("hello");
        dealoc($rootScope);
        done();
      }, 200);
    });

    it("should trust and use trusted urls", (done) => {
      const element = jqLite('<div><div ng-include="fooUrl">test</div></div>');
      const injector = angular.bootstrap(element);
      let $sce = injector.get("$sce");
      $rootScope = injector.get("$rootScope");
      $rootScope.fooUrl = $sce.trustAsResourceUrl(
        "http://localhost:4000/mock/hello",
      );
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toEqual("Hello");
        dealoc($rootScope);
        done();
      }, 200);
    });

    it("should include an external file", (done) => {
      element = jqLite('<div><ng:include src="url"></ng:include></div>');
      const body = jqLite(document.getElementById("dummy"));
      body.append(element);
      const injector = angular.bootstrap(element);
      $rootScope = injector.get("$rootScope");
      $templateCache = injector.get("$templateCache");
      $templateCache.put("myUrl", [200, "{{name}}", {}]);
      $rootScope.name = "misko";
      $rootScope.url = "myUrl";
      $rootScope.$digest();
      setTimeout(() => {
        expect(body.text()).toEqual("misko");
        body.empty();
        dealoc($rootScope);
        done();
      }, 200);
    });

    it('should support ng-include="src" syntax', (done) => {
      element = jqLite('<div><div ng-include="url"></div></div>');
      const injector = angular.bootstrap(element);
      $rootScope = injector.get("$rootScope");
      $rootScope.expr = "Alibaba";
      $rootScope.url = "/mock/interpolation";
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toEqual("Alibaba");
        done();
      }, 200);
    });

    it("should NOT use untrusted URL expressions ", () => {
      element = jqLite('<ng:include src="url"></ng:include>');
      const injector = angular.bootstrap(element);
      $rootScope = injector.get("$rootScope");
      $rootScope.url = "http://example.com/myUrl";
      expect(() => {
        $rootScope.$digest();
      }).toThrowError(/insecurl/);
    });

    it("should NOT use mistyped expressions ", () => {
      element = jqLite('<ng:include src="url"></ng:include>');
      const injector = angular.bootstrap(element);
      $rootScope = injector.get("$rootScope");
      $rootScope.name = "chirayu";
      let $sce = injector.get("$sce");
      $rootScope.url = $sce.trustAsUrl("http://example.com/myUrl");
      expect(() => {
        $rootScope.$digest();
      }).toThrowError(/insecurl/);
    });

    it("should remove previously included text if a falsy value is bound to src", (done) => {
      element = jqLite('<div><ng:include src="url"></ng:include></div>');
      const injector = angular.bootstrap(element);
      $rootScope = injector.get("$rootScope");
      $rootScope.expr = "igor";
      $rootScope.url = "/mock/interpolation";
      $rootScope.$digest();
      setTimeout(() => {
        expect(element.text()).toEqual("igor");
        $rootScope.url = undefined;
        $rootScope.$digest();
      }, 100);
      setTimeout(() => {
        expect(element.text()).toEqual("");
        done();
      }, 300);
    });

    it("should fire $includeContentRequested event on scope after making the xhr call", (done) => {
      let called = false;

      window.angular.module("myModule", []).run(($rootScope) => {
        $rootScope.$on("$includeContentRequested", (event) => {
          expect(event.targetScope).toBe($rootScope);
          called = true;
        });
      });
      element = jqLite(
        '<div><div><ng:include src="url"></ng:include></div></div>',
      );
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.url = "/mock/interpolation";
      $rootScope.$digest();

      setTimeout(() => {
        expect(called).toBe(true);
        done();
      }, 100);
    });

    it("should fire $includeContentLoaded event on child scope after linking the content", (done) => {
      let called = false;

      window.angular.module("myModule", []).run(($rootScope) => {
        $rootScope.$on("$includeContentLoaded", (event) => {
          expect(event.targetScope.$parent).toBe($rootScope);
          called = true;
        });
      });
      element = jqLite(
        '<div><div><ng:include src="url"></ng:include></div></div>',
      );
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.url = "/mock/interpolation";
      $rootScope.$digest();

      setTimeout(() => {
        expect(called).toBe(true);
        done();
      }, 100);
    });

    it("should fire $includeContentError event when content request fails", (done) => {
      const contentLoadedSpy = jasmine.createSpy("content loaded");
      const contentErrorSpy = jasmine.createSpy("content error");

      window.angular.module("myModule", []).run(($rootScope) => {
        $rootScope.url = "/mock/401";
        $rootScope.$on("$includeContentLoaded", contentLoadedSpy);
        $rootScope.$on("$includeContentError", contentErrorSpy);
      });

      element = jqLite(
        '<div><div><ng:include src="url"></ng:include></div></div>',
      );

      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.$digest();

      setTimeout(() => {
        expect(contentLoadedSpy).not.toHaveBeenCalled();
        expect(contentErrorSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it("should evaluate onload expression when a partial is loaded", (done) => {
      window.angular.module("myModule", []);

      element = jqLite(
        '<div><div><ng:include src="url" onload="loaded = true"></ng:include></div></div>',
      );
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.$digest();

      expect($rootScope.loaded).not.toBeDefined();
      $rootScope.url = "/mock/hello";
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toEqual("Hello");
        expect($rootScope.loaded).toBe(true);
        done();
      }, 100);
    });

    it("should create child scope and destroy old one", (done) => {
      window.angular.module("myModule", []);

      element = jqLite('<div><ng:include src="url"></ng:include></div>');
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.$digest();
      expect(element.children().scope()).toBeFalsy();

      $rootScope.url = "/mock/hello";
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.children().scope().$parent).toBe($rootScope);
        expect(element.text()).toBe("Hello");

        $rootScope.url = "/mock/401";
        $rootScope.$digest();
      }, 100);

      setTimeout(() => {
        expect($rootScope.$$childHead).toBeFalsy();
        expect(element.text()).toBe("");

        $rootScope.url = "/mock/hello";
        $rootScope.$digest();
      }, 200);

      setTimeout(() => {
        expect(element.children().scope().$parent).toBe($rootScope);

        $rootScope.url = null;
        $rootScope.$digest();
      }, 300);

      setTimeout(() => {
        expect($rootScope.$$childHead).toBeFalsy();
        done();
      }, 400);
    });

    it("should do xhr request and cache it", (done) => {
      window.angular.module("myModule", []);
      element = jqLite('<div><ng:include src="url"></ng:include></div>');
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.url = "/mock/hello";
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toEqual("Hello");
        $rootScope.url = null;
        $rootScope.$digest();
      }, 100);

      setTimeout(() => {
        expect(element.text()).toEqual("");
        $rootScope.url = "/mock/hello";
        $rootScope.$digest();
        // No request being made
        expect(element.text()).toEqual("Hello");
        done();
      }, 200);
    });

    it("should clear content when error during xhr request", () => {
      window.angular.module("myModule", []);
      element = jqLite('<div><ng:include src="url">content</ng:include></div>');
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.url = "/mock/401";
      $rootScope.$digest();
      expect(element.text()).toBe("");
    });

    it("should be async even if served from cache", (done) => {
      window.angular.module("myModule", []);
      element = jqLite('<div><ng:include src="url"></ng:include></div>');
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.url = "/mock/hello";

      let called = 0;
      // we want to assert only during first watch
      $rootScope.$watch(() => {
        if (!called) expect(element.text()).toBe("");
        called++;
      });

      $rootScope.$digest();
      setTimeout(() => {
        expect(element.text()).toBe("Hello");
        done();
      }, 200);
    });

    it("should discard pending xhr callbacks if a new template is requested before the current finished loading", (done) => {
      window.angular.module("myModule", []);
      element = jqLite(
        "<div><ng:include src='templateUrl'></ng:include></div>",
      );
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.templateUrl = "/mock/hello";
      $rootScope.$digest();
      $rootScope.expr = "test";
      $rootScope.templateUrl = "/mock/interpolation";
      $rootScope.$digest();
      expect(element.text()).toBe("");

      setTimeout(() => {
        expect(element.text()).toBe("test");
        done();
      }, 200);
    });

    it("should not break attribute bindings on the same element", (done) => {
      window.angular.module("myModule", []);
      element = jqLite(
        '<div><span foo="#/{{hrefUrl}}" ng:include="includeUrl"></span></div>',
      );
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.hrefUrl = "fooUrl1";
      $rootScope.includeUrl = "/mock/hello";
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toBe("Hello");
        expect(element.find("span").attr("foo")).toBe("#/fooUrl1");

        $rootScope.hrefUrl = "fooUrl2";
        $rootScope.$digest();

        expect(element.text()).toBe("Hello");
        expect(element.find("span").attr("foo")).toBe("#/fooUrl2");

        $rootScope.includeUrl = "/mock/hello2";
        $rootScope.$digest();
      }, 100);

      setTimeout(() => {
        expect(element.text()).toBe("Hello2");
        expect(element.find("span").attr("foo")).toBe("#/fooUrl2");
        done();
      }, 200);
    });

    it("should exec scripts when jQuery is included", (done) => {
      // TODO make this independent of Jquery

      window.angular.module("myModule", []);
      element = jqLite('<div><span ng-include="includeUrl"></span></div>');

      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");

      $rootScope.includeUrl = "/mock/script";

      $rootScope.$digest();

      setTimeout(() => {
        expect(window.SCRIPT_RAN).toBe(true);

        delete window._ngIncludeCausesScriptToRun;
        done();
      }, 200);
    });

    it("should construct SVG template elements with correct namespace", (done) => {
      window.angular.module("myModule", []).directive(
        "test",
        valueFn({
          templateNamespace: "svg",
          templateUrl: "/mock/my-rect.html",
          replace: true,
        }),
      );
      element = jqLite("<svg><test></test></svg>");
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.$digest();
      setTimeout(() => {
        const child = element.find("rect");
        expect(child.length).toBe(2);
        //   // eslint-disable-next-line no-undef
        expect(child[0] instanceof SVGRectElement).toBe(true);
        done();
      }, 200);
    });

    it("should compile only the template content of an SVG template", (done) => {
      window.angular.module("myModule", []).directive(
        "test",
        valueFn({
          templateNamespace: "svg",
          templateUrl: "/mock/my-rect2.html",
          replace: true,
        }),
      );
      element = jqLite("<svg><test></test></svg>");
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.$digest();
      setTimeout(() => {
        expect(element.find("a").length).toBe(0);
        done();
      }, 200);
    });

    it("should not compile template if original scope is destroyed", (done) => {
      window.angular.module("myModule", []);
      element = jqLite(
        '<div ng-if="show"><div ng-include="\'/mock/hello\'"></div></div>',
      );
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      $rootScope.show = true;
      $rootScope.$digest();
      $rootScope.show = false;
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toBe("");
        done();
      }, 200);
    });

    it("should not trigger a digest when the include is changed", (done) => {
      window.angular.module("myModule", []);
      element = jqLite('<div><ng-include src="url"></ng-include></div>');
      const injector = angular.bootstrap(element, ["myModule"]);
      $rootScope = injector.get("$rootScope");
      const spy = spyOn($rootScope, "$digest").and.callThrough();

      $rootScope.url = "/mock/hello";
      $rootScope.$digest();

      setTimeout(() => {
        expect(element.text()).toEqual("Hello");
        $rootScope.$apply('url = "/mock/hello2"');
      }, 200);

      setTimeout(() => {
        spy.calls.reset();
      }, 300);

      setTimeout(() => {
        expect(element.text()).toEqual("Hello2");
        expect(spy).not.toHaveBeenCalled();
        done();
      }, 400);
    });

    describe("autoscroll", () => {
      let autoScrollSpy;
      let $animate;

      it("should call $anchorScroll if autoscroll attribute is present", (done) => {
        window.angular.module("myModule", [
          function ($provide) {
            autoScrollSpy = jasmine.createSpy("$anchorScroll");
            $provide.value("$anchorScroll", autoScrollSpy);
          },
        ]);
        element = jqLite(
          '<div><ng:include src="tpl" autoscroll></ng:include></div>',
        );
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");
        $animate = injector.get("$animate");
        $rootScope.$apply(() => {
          $rootScope.tpl = "/mock/hello";
        });

        setTimeout(() => {
          expect(autoScrollSpy).toHaveBeenCalled();
          done();
        }, 400);
      });

      it("should call $anchorScroll if autoscroll evaluates to true", (done) => {
        window.angular.module("myModule", [
          function ($provide) {
            autoScrollSpy = jasmine.createSpy("$anchorScroll");
            $provide.value("$anchorScroll", autoScrollSpy);
          },
        ]);
        element = jqLite(
          '<div><ng:include src="tpl" autoscroll="value"></ng:include></div>',
        );
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");

        $rootScope.$apply(() => {
          $rootScope.tpl = "/mock/hello";
          $rootScope.value = true;
        });

        $rootScope.$digest();

        setTimeout(() => {
          expect(autoScrollSpy).toHaveBeenCalled();
          done();
        }, 100);
      });

      it("should not call $anchorScroll if autoscroll attribute is not present", (done) => {
        window.angular.module("myModule", [
          function ($provide) {
            autoScrollSpy = jasmine.createSpy("$anchorScroll");
            $provide.value("$anchorScroll", autoScrollSpy);
          },
        ]);

        element = jqLite('<div><ng:include src="tpl"></ng:include></div>');
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");

        $rootScope.$apply(() => {
          $rootScope.tpl = "/mock/hello";
        });
        $rootScope.$digest();

        setTimeout(() => {
          expect(autoScrollSpy).not.toHaveBeenCalled();
          done();
        }, 100);
      });

      it("should not call $anchorScroll if autoscroll evaluates to false", (done) => {
        window.angular.module("myModule", [
          function ($provide) {
            autoScrollSpy = jasmine.createSpy("$anchorScroll");
            $provide.value("$anchorScroll", autoScrollSpy);
          },
        ]);

        element = jqLite(
          '<div><ng:include src="tpl" autoscroll="value"></ng:include></div>',
        );
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");

        $rootScope.$apply(() => {
          $rootScope.tpl = "/mock/hello";
          $rootScope.value = false;
        });

        $rootScope.$apply(() => {
          $rootScope.tpl = "/mock/hello";
          $rootScope.value = undefined;
        });

        $rootScope.$apply(() => {
          $rootScope.tpl = "/mock/hello";
          $rootScope.value = null;
        });

        setTimeout(() => {
          expect(autoScrollSpy).not.toHaveBeenCalled();
          done();
        }, 100);
      });

      // it('should only call $anchorScroll after the "enter" animation completes', inject(
      //   compileAndLink(
      //     '<div><ng:include src="tpl" autoscroll></ng:include></div>',
      //   ),
      //   ($rootScope, $animate, $timeout) => {
      //     expect(autoScrollSpy).not.toHaveBeenCalled();

      //     $rootScope.$apply("tpl = 'template.html'");
      //     expect($animate.queue.shift().event).toBe("enter");

      //     $animate.flush();
      //     $rootScope.$digest();

      //     expect(autoScrollSpy).toHaveBeenCalled();
      //   },
      // ));
    });

    describe("and transcludes", () => {
      let element;

      afterEach(() => {
        if (element) {
          dealoc(element);
        }
      });

      it("should allow access to directive controller from children when used in a replace template", (done) => {
        let controller;
        window.angular
          .module("myModule", [])
          .directive(
            "template",
            valueFn({
              template: "<div ng-include=\"'/mock/directive'\"></div>",
              replace: true,
              controller() {
                this.flag = true;
              },
            }),
          )
          .directive(
            "test",
            valueFn({
              require: "^template",
              link(scope, el, attr, ctrl) {
                controller = ctrl;
              },
            }),
          );
        element = jqLite("<div><div template></div></div>");
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");

        $rootScope.$apply();
        setTimeout(() => {
          expect(controller.flag).toBe(true);
          done();
        }, 100);
      });

      it("should compile its content correctly (although we remove it later)", (done) => {
        let testElement;
        window.angular.module("myModule", []).directive("test", () => ({
          link(scope, element) {
            testElement = element;
          },
        }));

        element = jqLite(
          "<div><div ng-include=\"'/mock/empty'\"><div test></div></div></div>",
        );
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");
        $rootScope.$apply();
        setTimeout(() => {
          expect(testElement[0].nodeName).toBe("DIV");
          done();
        }, 100);
      });

      it("should link directives on the same element after the content has been loaded", (done) => {
        let contentOnLink;
        window.angular.module("myModule", []).directive("test", () => ({
          link(scope, element) {
            contentOnLink = element.text();
          },
        }));
        element = jqLite("<div><div ng-include=\"'/mock/hello'\" test></div>");
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");
        $rootScope.$apply();

        setTimeout(() => {
          expect(contentOnLink).toBe("Hello");
          done();
        }, 100);
      });

      it("should add the content to the element before compiling it", (done) => {
        let root;
        window.angular.module("myModule", []).directive("test", () => ({
          link(scope, el) {
            root = el.parent().parent().parent();
          },
        }));
        element = jqLite("<div><div ng-include=\"'/mock/directive'\"></div>");
        const injector = angular.bootstrap(element, ["myModule"]);
        $rootScope = injector.get("$rootScope");
        $rootScope.$apply();

        setTimeout(() => {
          expect(root[0]).toBe(element[0]);
          done();
        }, 100);
      });
    });

    // describe("and animations", () => {
    //   let body;
    //   let element;
    //   let $rootElement;

    //   function html(content) {
    //     $rootElement.html(content);
    //     element = $rootElement.children().eq(0);
    //     return element;
    //   }

    //   // beforeEach(
    //   //   module(
    //   //     () =>
    //   //       // we need to run animation on attached elements;
    //   //       function (_$rootElement_) {
    //   //         $rootElement = _$rootElement_;
    //   //         body = jqLite(window.document.body);
    //   //         body.append($rootElement);
    //   //       },
    //   //   ),
    //   // );

    //   afterEach(() => {
    //     dealoc(body);
    //     dealoc(element);
    //   });

    //   // beforeEach(module("ngAnimateMock"));

    //   afterEach(() => {
    //     dealoc(element);
    //   });

    //   it("should fire off the enter animation", () => {
    //     let item;

    //     $templateCache.put("enter", [200, "<div>data</div>", {}]);
    //     $rootScope.tpl = "enter";
    //     element = $compile(
    //       html("<div><div " + 'ng-include="tpl">' + "</div></div>"),
    //     )($rootScope);
    //     $rootScope.$digest();

    //     const animation = $animate.queue.pop();
    //     expect(animation.event).toBe("enter");
    //     expect(animation.element.text()).toBe("data");
    //   });

    //   it("should fire off the leave animation", () => {
    //     let item;
    //     $templateCache.put("enter", [200, "<div>data</div>", {}]);
    //     $rootScope.tpl = "enter";
    //     element = $compile(
    //       html("<div><div " + 'ng-include="tpl">' + "</div></div>"),
    //     )($rootScope);
    //     $rootScope.$digest();

    //     let animation = $animate.queue.shift();
    //     expect(animation.event).toBe("enter");
    //     expect(animation.element.text()).toBe("data");

    //     $rootScope.tpl = "";
    //     $rootScope.$digest();

    //     animation = $animate.queue.shift();
    //     expect(animation.event).toBe("leave");
    //     expect(animation.element.text()).toBe("data");
    //   });

    //   it("should animate two separate ngInclude elements", () => {
    //     let item;
    //     $templateCache.put("one", [200, "one", {}]);
    //     $templateCache.put("two", [200, "two", {}]);
    //     $rootScope.tpl = "one";
    //     element = $compile(
    //       html("<div><div " + 'ng-include="tpl">' + "</div></div>"),
    //     )($rootScope);
    //     $rootScope.$digest();

    //     const item1 = $animate.queue.shift().element;
    //     expect(item1.text()).toBe("one");

    //     $rootScope.tpl = "two";
    //     $rootScope.$digest();

    //     const itemA = $animate.queue.shift().element;
    //     const itemB = $animate.queue.shift().element;
    //     expect(itemA.attr("ng-include")).toBe("tpl");
    //     expect(itemB.attr("ng-include")).toBe("tpl");
    //     expect(itemA).not.toEqual(itemB);
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
    //     () => {
    //       let item;
    //       const $scope = $rootScope.$new();
    //       element = $compile(
    //         html("<div>" + '<div ng-include="inc">Yo</div>' + "</div>"),
    //       )($scope);

    //       $templateCache.put("one", [200, "<div>one</div>", {}]);
    //       $templateCache.put("two", [200, "<div>two</div>", {}]);

    //       $scope.$apply('inc = "one"');

    //       let destroyed;
    //       const inner = element.children(0);
    //       inner.on("$destroy", () => {
    //         destroyed = true;
    //       });

    //       $scope.$apply('inc = "two"');

    //       $scope.$apply('inc = "one"');

    //       $scope.$apply('inc = "two"');

    //       expect(destroyed).toBe(true);
    //     };
    //   });
    // });
  });
});
