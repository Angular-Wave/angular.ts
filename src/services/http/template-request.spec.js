import { createInjector } from "../../injector";
import { Angular } from "../../loader";

describe("$templateRequest", () => {
  let module, $rootScope, $templateRequest, $templateCache, $sce, angular;

  beforeEach(() => {
    angular = window.angular = new Angular();
    module = angular.module("test", ["ng"]);
    let injector = createInjector(["test"]);
    $rootScope = injector.get("$rootScope");
    $templateRequest = injector.get("$templateRequest");
    $templateCache = injector.get("$templateCache");
    $sce = injector.get("$sce");
  });

  describe("provider", () => {
    describe("httpOptions", () => {
      it("should default to undefined and fallback to default $http options", () => {
        let defaultHeader;

        angular.module("test", [
          "ng",
          ($templateRequestProvider) => {
            expect($templateRequestProvider.httpOptions()).toBeUndefined();
          },
        ]);

        createInjector(["test"]).invoke(
          ($templateRequest, $http, $templateCache) => {
            spyOn($http, "get").and.callThrough();

            $templateRequest("tpl.html");

            expect($http.get).toHaveBeenCalledOnceWith("tpl.html", {
              cache: $templateCache,
              transformResponse: [],
            });
          },
        );
      });

      it("should be configurable", () => {
        function someTransform() {}

        angular.module("test", [
          "ng",
          ($templateRequestProvider) => {
            // Configure the template request service to provide  specific headers and transforms
            $templateRequestProvider.httpOptions({
              headers: { Accept: "moo" },
              transformResponse: [someTransform],
            });
          },
        ]);

        createInjector(["test"]).invoke(
          ($templateRequest, $http, $templateCache) => {
            spyOn($http, "get").and.callThrough();

            $templateRequest("tpl.html");

            expect($http.get).toHaveBeenCalledOnceWith("tpl.html", {
              cache: $templateCache,
              transformResponse: [someTransform],
              headers: { Accept: "moo" },
            });
          },
        );
      });

      it("should be allow you to override the cache", () => {
        const httpOptions = {};

        angular.module("test", [
          "ng",
          ($templateRequestProvider) => {
            $templateRequestProvider.httpOptions(httpOptions);
          },
        ]);

        createInjector(["test"]).invoke(
          ($templateRequest, $http, $cacheFactory) => {
            spyOn($http, "get").and.callThrough();

            const customCache = $cacheFactory("customCache");
            httpOptions.cache = customCache;

            $templateRequest("tpl.html");

            expect($http.get).toHaveBeenCalledOnceWith("tpl.html", {
              cache: customCache,
              transformResponse: [],
            });
          },
        );
      });
    });
  });

  it("should download the provided template file", async () => {
    let content;
    await $templateRequest("/mock/div").then((html) => {
      content = html;
    });

    $rootScope.$digest();
    expect(content).toBe("<div>Hello</div>");
  });

  it("should cache the request to prevent extra downloads", async () => {
    const content = [];
    function tplRequestCb(html) {
      content.push(html);
    }

    await $templateRequest("/mock/div").then(tplRequestCb);

    $templateRequest("/mock/div").then(tplRequestCb);
    $rootScope.$digest();

    expect(content[0]).toBe("<div>Hello</div>");
    expect(content[1]).toBe("<div>Hello</div>");
    expect($templateCache.get("/mock/div")).toBe("<div>Hello</div>");
  });

  it("should return the cached value on the first request", async () => {
    spyOn($templateCache, "put").and.returnValue("_matias");

    const content = [];
    function tplRequestCb(html) {
      content.push(html);
    }

    await $templateRequest("tpl.html").then(tplRequestCb);
    $rootScope.$digest();

    expect(content[0]).toBe("_matias");
  });

  it("should call `$exceptionHandler` on request error", async () => {
    let err;
    await $templateRequest("/mock/404").catch((reason) => {
      err = reason;
    });

    expect(err).toMatch(/tpload/);
  });

  it("should not call `$exceptionHandler` when the template is empty", async () => {
    const onError = jasmine.createSpy("onError");
    await $templateRequest("/mock/empty").catch(onError);
    $rootScope.$digest();

    expect(onError).not.toHaveBeenCalled();
  });

  it("should accept empty templates and refuse null or undefined templates in cache", () => {
    // Will throw on any template not in cache.
    spyOn($sce, "getTrustedResourceUrl").and.returnValue(false);

    expect(() => {
      $templateRequest("tpl.html"); // should go through $sce
      $rootScope.$digest();
    }).toThrow();

    $templateCache.put("tpl.html"); // is a no-op, so $sce check as well.
    expect(() => {
      $templateRequest("tpl.html");
      $rootScope.$digest();
    }).toThrow();
    $templateCache.removeAll();

    $templateCache.put("tpl.html", null); // makes no sense, but it's been added, so trust it.
    expect(() => {
      $templateRequest("tpl.html");
      $rootScope.$digest();
    }).not.toThrow();
    $templateCache.removeAll();

    $templateCache.put("tpl.html", ""); // should work (empty template)
    expect(() => {
      $templateRequest("tpl.html");
      $rootScope.$digest();
    }).not.toThrow();
    $templateCache.removeAll();
  });

  it("should keep track of how many requests are going on", async () => {
    let res = $templateRequest("/mock/div");
    $templateRequest("/mock/div");

    expect($templateRequest.totalPendingRequests).toBe(2);

    $rootScope.$digest();
    await res;
    expect($templateRequest.totalPendingRequests).toBe(0);
  });

  it("should not try to parse a response as JSON", async () => {
    const spy = jasmine.createSpy("success");
    await $templateRequest("/mock/jsoninterpolation").then(spy);

    expect(spy).toHaveBeenCalledOnceWith('"{{expr}}"');
  });

  it("should use custom response transformers (array)", async () => {
    module.config(($httpProvider) => {
      $httpProvider.defaults.transformResponse.push((data) => `${data}!!`);
    });
    let injector = createInjector(["test"]);
    $rootScope = injector.get("$rootScope");
    $templateRequest = injector.get("$templateRequest");
    $templateCache = injector.get("$templateCache");

    const spy = jasmine.createSpy("success");

    await $templateRequest("/mock/jsoninterpolation").then(spy);
    expect(spy).toHaveBeenCalledOnceWith('"{{expr}}"!!');
  });

  it("should use custom response transformers (function)", async () => {
    module.config(($httpProvider) => {
      $httpProvider.defaults.transformResponse = function (data) {
        return `${data}!!`;
      };
    });
    let injector = createInjector(["test"]);
    $rootScope = injector.get("$rootScope");
    $templateRequest = injector.get("$templateRequest");
    $templateCache = injector.get("$templateCache");
    const spy = jasmine.createSpy("success");
    await $templateRequest("/mock/jsoninterpolation").then(spy);
    expect(spy).toHaveBeenCalledOnceWith('"{{expr}}"!!');
  });
});
