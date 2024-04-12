describe("$templateRequest", () => {
  describe("provider", () => {
    describe("httpOptions", () => {
      it("should default to undefined and fallback to default $http options", () => {
        let defaultHeader;

        module(($templateRequestProvider) => {
          expect($templateRequestProvider.httpOptions()).toBeUndefined();
        });

        inject(($templateRequest, $http, $templateCache) => {
          spyOn($http, "get").and.callThrough();

          $templateRequest("tpl.html");

          expect($http.get).toHaveBeenCalledOnceWith("tpl.html", {
            cache: $templateCache,
            transformResponse: [],
          });
        });
      });

      it("should be configurable", () => {
        function someTransform() {}

        module(($templateRequestProvider) => {
          // Configure the template request service to provide  specific headers and transforms
          $templateRequestProvider.httpOptions({
            headers: { Accept: "moo" },
            transformResponse: [someTransform],
          });
        });

        inject(($templateRequest, $http, $templateCache) => {
          spyOn($http, "get").and.callThrough();

          $templateRequest("tpl.html");

          expect($http.get).toHaveBeenCalledOnceWith("tpl.html", {
            cache: $templateCache,
            transformResponse: [someTransform],
            headers: { Accept: "moo" },
          });
        });
      });

      it("should be allow you to override the cache", () => {
        const httpOptions = {};

        module(($templateRequestProvider) => {
          $templateRequestProvider.httpOptions(httpOptions);
        });

        inject(($templateRequest, $http, $cacheFactory) => {
          spyOn($http, "get").and.callThrough();

          const customCache = $cacheFactory("customCache");
          httpOptions.cache = customCache;

          $templateRequest("tpl.html");

          expect($http.get).toHaveBeenCalledOnceWith("tpl.html", {
            cache: customCache,
            transformResponse: [],
          });
        });
      });
    });
  });

  it("should download the provided template file", inject((
    $rootScope,
    $templateRequest,
    $httpBackend,
  ) => {
    $httpBackend.expectGET("tpl.html").respond("<div>abc</div>");

    let content;
    $templateRequest("tpl.html").then((html) => {
      content = html;
    });

    $rootScope.$digest();
    $httpBackend.flush();

    expect(content).toBe("<div>abc</div>");
  }));

  it("should cache the request to prevent extra downloads", inject((
    $rootScope,
    $templateRequest,
    $templateCache,
    $httpBackend,
  ) => {
    $httpBackend.expectGET("tpl.html").respond("matias");

    const content = [];
    function tplRequestCb(html) {
      content.push(html);
    }

    $templateRequest("tpl.html").then(tplRequestCb);
    $httpBackend.flush();

    $templateRequest("tpl.html").then(tplRequestCb);
    $rootScope.$digest();

    expect(content[0]).toBe("matias");
    expect(content[1]).toBe("matias");
    expect($templateCache.get("tpl.html")).toBe("matias");
  }));

  it("should return the cached value on the first request", inject((
    $rootScope,
    $templateRequest,
    $templateCache,
    $httpBackend,
  ) => {
    $httpBackend.expectGET("tpl.html").respond("matias");
    spyOn($templateCache, "put").and.returnValue("_matias");

    const content = [];
    function tplRequestCb(html) {
      content.push(html);
    }

    $templateRequest("tpl.html").then(tplRequestCb);
    $rootScope.$digest();
    $httpBackend.flush();

    expect(content[0]).toBe("_matias");
  }));

  it("should call `$exceptionHandler` on request error", () => {
    inject(($exceptionHandler, $httpBackend, $templateRequest) => {
      $httpBackend.expectGET("tpl.html").respond(404, "", {}, "Not Found");

      let err;
      $templateRequest("tpl.html").catch((reason) => {
        err = reason;
      });
      $httpBackend.flush();

      expect(err).toEqualMinErr(
        "$templateRequest",
        "tpload",
        "Failed to load template: tpl.html (HTTP status: 404 Not Found)",
      );
      expect($exceptionHandler.errors[0]).toEqualMinErr(
        "$templateRequest",
        "tpload",
        "Failed to load template: tpl.html (HTTP status: 404 Not Found)",
      );
    });
  });

  it("should not call `$exceptionHandler` on request error when `ignoreRequestError` is true", () => {
    inject(($exceptionHandler, $httpBackend, $templateRequest) => {
      $httpBackend.expectGET("tpl.html").respond(404);

      let err;
      $templateRequest("tpl.html", true).catch((reason) => {
        err = reason;
      });
      $httpBackend.flush();

      expect(err.status).toBe(404);
      expect($exceptionHandler.errors).toEqual([]);
    });
  });

  it("should not call `$exceptionHandler` when the template is empty", inject((
    $exceptionHandler,
    $httpBackend,
    $rootScope,
    $templateRequest,
  ) => {
    $httpBackend.expectGET("tpl.html").respond("");

    const onError = jasmine.createSpy("onError");
    $templateRequest("tpl.html").catch(onError);
    $rootScope.$digest();
    $httpBackend.flush();

    expect(onError).not.toHaveBeenCalled();
    expect($exceptionHandler.errors).toEqual([]);
  }));

  it("should accept empty templates and refuse null or undefined templates in cache", inject((
    $rootScope,
    $templateRequest,
    $templateCache,
    $sce,
  ) => {
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
  }));

  it("should keep track of how many requests are going on", inject((
    $rootScope,
    $templateRequest,
    $httpBackend,
  ) => {
    $httpBackend.expectGET("a.html").respond("a");
    $httpBackend.expectGET("b.html").respond("c");
    $templateRequest("a.html");
    $templateRequest("b.html");

    expect($templateRequest.totalPendingRequests).toBe(2);

    $rootScope.$digest();
    $httpBackend.flush();

    expect($templateRequest.totalPendingRequests).toBe(0);

    $httpBackend.expectGET("c.html").respond(404);
    $templateRequest("c.html");

    expect($templateRequest.totalPendingRequests).toBe(1);
    $rootScope.$digest();

    try {
      $httpBackend.flush();
    } catch (e) {
      /* empty */
    }

    expect($templateRequest.totalPendingRequests).toBe(0);
  }));

  it("should not try to parse a response as JSON", inject((
    $templateRequest,
    $httpBackend,
  ) => {
    const spy = jasmine.createSpy("success");
    $httpBackend.expectGET("a.html").respond("{{text}}", {
      "Content-Type": "application/json",
    });
    $templateRequest("a.html").then(spy);
    $httpBackend.flush();
    expect(spy).toHaveBeenCalledOnceWith("{{text}}");
  }));

  it("should use custom response transformers (array)", () => {
    module(($httpProvider) => {
      $httpProvider.defaults.transformResponse.push((data) => `${data}!!`);
    });
    inject(($templateRequest, $httpBackend) => {
      const spy = jasmine.createSpy("success");
      $httpBackend.expectGET("a.html").respond("{{text}}", {
        "Content-Type": "application/json",
      });
      $templateRequest("a.html").then(spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledOnceWith("{{text}}!!");
    });
  });

  it("should use custom response transformers (function)", () => {
    module(($httpProvider) => {
      $httpProvider.defaults.transformResponse = function (data) {
        return `${data}!!`;
      };
    });
    inject(($templateRequest, $httpBackend) => {
      const spy = jasmine.createSpy("success");
      $httpBackend.expectGET("a.html").respond("{{text}}", {
        "Content-Type": "application/json",
      });
      $templateRequest("a.html").then(spy);
      $httpBackend.flush();
      expect(spy).toHaveBeenCalledOnceWith("{{text}}!!");
    });
  });
});
