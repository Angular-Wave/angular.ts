fdescribe("UrlRouter", function () {
  let router;
  let $urp, $lp, $umf, $s, $ur, location, match, scope;

  describe("provider", function () {
    beforeEach(function () {
      angular
        .module("ui.router.router.test", [])
        .config(function ($uiRouterProvider) {
          router = $uiRouterProvider;
          $umf = router.urlMatcherFactory;
          $urp = router.urlRouterProvider;
          $urp.deferIntercept();
        });

      module("ui.router.router", "ui.router.router.test");

      // function ($rootScope, $location) {
      //   scope = $rootScope.$new();
      //   location = $location;
      // }
    });

    it("should throw on non-function rules", function () {
      expect(function () {
        $urp.rule(null);
      }).toThrowError("'rule' must be a function");
      expect(function () {
        $urp.otherwise(null);
      }).toThrowError("'rule' must be a string or function");
    });

    it("should allow location changes to be deferred", () => {
      const log = [];

      $urp.rule(function ($injector, $location) {
        log.push($location.path());
        return null;
      });

      $location.path("/foo");
      $rootScope.$broadcast("$locationChangeSuccess");

      expect(log).toEqual([]);

      $urlRouter.listen();
      $rootScope.$broadcast("$locationChangeSuccess");

      expect(log).toEqual(["/foo"]);
    });
  });

  describe("service", function () {
    beforeEach(function () {
      angular
        .module("ui.router.router.test", [])
        .config(function ($uiRouterProvider, $locationProvider) {
          router = $uiRouterProvider;
          $umf = router.urlMatcherFactory;
          $urp = router.urlRouterProvider;
          $lp = $locationProvider;
          $locationProvider.hashPrefix("");

          $urp
            .rule(function ($injector, $location) {
              const path = $location.path();
              if (!/baz/.test(path)) return;
              return path.replace("baz", "b4z");
            })
            .when("/foo/:param", function ($match) {
              match = ["/foo/:param", $match];
            })
            .when("/bar", function ($match) {
              match = ["/bar", $match];
            });
        });

      // function ($rootScope, $location, $injector) {
      //   scope = $rootScope.$new();
      //   location = $location;
      //   $ur = $injector.invoke($urp['$get'], $urp);
      //   $s = $injector.get('$sniffer');
      //   $s['history'] = true;
      // };
    });

    it("should execute rewrite rules", function () {
      location.path("/foo");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/foo");

      location.path("/baz");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/b4z");
    });

    it("should keep otherwise last", function () {
      $urp.otherwise("/otherwise");

      location.path("/lastrule");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/otherwise");

      $urp.when("/lastrule", function ($match) {
        match = ["/lastrule", $match];
      });

      location.path("/lastrule");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/lastrule");
    });

    it("can be cancelled by preventDefault() in $locationChangeSuccess", function () {
      let called;
      location.path("/baz");
      scope.$on("$locationChangeSuccess", function (ev) {
        ev.preventDefault();
        called = true;
      });
      scope.$emit("$locationChangeSuccess");
      expect(called).toBeTruthy();
      expect(location.path()).toBe("/baz");
    });

    it("can be deferred and updated in $locationChangeSuccess", function () {
      let called;
      location.path("/baz");
      scope.$on("$locationChangeSuccess", function (ev) {
        ev.preventDefault();
        called = true;
        $timeout(() => $urlRouter.sync(), 2000);
      });
      scope.$emit("$locationChangeSuccess");
      $timeout.flush();
      expect(called).toBeTruthy();
      expect(location.path()).toBe("/b4z");
    });

    it("rule should return a deregistration function", function () {
      let count = 0;
      let rule = {
        match: () => count++,
        handler: (match) => match,
        matchPriority: () => 0,
        $id: 0,
        priority: 0,
        _group: 0,
        type: "RAW",
      };
      const dereg = $ur.rule(rule);

      $ur.sync();
      expect(count).toBe(1);
      $ur.sync();
      expect(count).toBe(2);

      dereg();
      $ur.sync();
      expect(count).toBe(2);
    });

    it("removeRule should remove a previously registered rule", function () {
      let count = 0;
      let rule = {
        match: () => count++,
        handler: (match) => match,
        matchPriority: () => 0,
        $id: 0,
        priority: 0,
        _group: 0,
        type: "RAW",
      };
      $ur.rule(rule);

      $ur.sync();
      expect(count).toBe(1);
      $ur.sync();
      expect(count).toBe(2);

      $ur.removeRule(rule);
      $ur.sync();
      expect(count).toBe(2);
    });

    describe("location updates", function () {
      it("can push location changes", function ($urlRouter) {
        const spy = spyOn(router.locationService, "url");
        $urlRouter.push($umf.compile("/hello/:name"), { name: "world" });
        expect(spy).toHaveBeenCalled();
        expect(spy.calls.mostRecent().args[0]).toBe("/hello/world");
      });

      it("can push a replacement location", function ($urlRouter, $location) {
        const spy = spyOn(router.locationService, "url");
        $urlRouter.push(
          $umf.compile("/hello/:name"),
          { name: "world" },
          { replace: true },
        );
        expect(spy).toHaveBeenCalled();
        expect(spy.calls.mostRecent().args.slice(0, 2)).toEqual([
          "/hello/world",
          true,
        ]);
      });

      it("can push location changes with no parameters", function ($urlRouter, $location) {
        const spy = spyOn(router.locationService, "url");
        $urlRouter.push(
          $umf.compile("/hello/:name", { state: { params: { name: "" } } }),
        );
        expect(spy).toHaveBeenCalled();
        expect(spy.calls.mostRecent().args[0]).toBe("/hello/");
      });

      it("can push an empty url", function ($urlRouter, $location) {
        const spy = spyOn(router.locationService, "url");
        $urlRouter.push(
          $umf.compile("/{id}", {
            state: { params: { id: { squash: true, value: null } } },
          }),
        );
        expect(spy).toHaveBeenCalled();
        expect(spy.calls.mostRecent().args[0]).toBe("");
      });

      // Angular 1.2 doesn't seem to support $location.url("")
      if (angular.version.minor >= 3) {
        // Test for https://github.com/angular-ui/ui-router/issues/3563
        it("updates url after an empty url is pushed", function ($urlRouter, $location) {
          $lp.html5Mode(false);
          const spy = spyOn(router.locationService, "url").and.callThrough();
          $urlRouter.push($umf.compile("/foobar"));
          expect(spy.calls.mostRecent().args[0]).toBe("/foobar");
          $urlRouter.push(
            $umf.compile("/{id}", {
              state: { params: { id: { squash: true, value: null } } },
            }),
          );
          expect(spy.calls.mostRecent().args[0]).toBe("");
          expect(router.locationService.url()).toBe("/");
        });

        // Test #2 for https://github.com/angular-ui/ui-router/issues/3563
        it("updates html5mode url after an empty url is pushed", function ($urlRouter, $location) {
          $lp.html5Mode(true);
          const spy = spyOn(router.locationService, "url").and.callThrough();
          $urlRouter.push($umf.compile("/foobar"));
          expect(spy.calls.mostRecent().args[0]).toBe("/foobar");
          $urlRouter.push(
            $umf.compile("/{id}", {
              state: { params: { id: { squash: true, value: null } } },
            }),
          );
          expect(spy.calls.mostRecent().args[0]).toBe("");
          expect(router.locationService.url()).toBe("/");
        });
      }

      it("can push location changes that include a #fragment", function ($urlRouter, $location) {
        // html5mode disabled
        $lp.html5Mode(false);
        expect(html5Compat($lp.html5Mode())).toBe(false);
        $urlRouter.push($umf.compile("/hello/:name"), {
          name: "world",
          "#": "frag",
        });
        expect($location.url()).toBe("/hello/world#frag");
        expect($location.hash()).toBe("frag");

        // html5mode enabled
        $lp.html5Mode(true);
        expect(html5Compat($lp.html5Mode())).toBe(true);
        $urlRouter.push($umf.compile("/hello/:name"), {
          name: "world",
          "#": "frag",
        });
        expect($location.url()).toBe("/hello/world#frag");
        expect($location.hash()).toBe("frag");
      });

      it("can read and sync a copy of location URL", function ($urlRouter, $location) {
        $location.url("/old");

        spyOn(router.locationService, "url").and.callThrough();
        $urlRouter.update(true);
        expect(router.locationService.url).toHaveBeenCalled();

        $location.url("/new");
        $urlRouter.update();

        expect($location.url()).toBe("/old");
      });

      it("can read and sync a copy of location URL including query params", function ($urlRouter, $location) {
        $location.url("/old?param=foo");

        spyOn(router.locationService, "url").and.callThrough();
        $urlRouter.update(true);
        expect(router.locationService.url).toHaveBeenCalled();

        $location.url("/new?param=bar");
        $urlRouter.update();

        expect($location.url()).toBe("/old?param=foo");
      });
    });

    describe("URL generation", function () {
      it("should return null when UrlMatcher rejects parameters", function () {
        $umf.type("custom", { is: (val) => val === 1138 });
        const matcher = $umf.compile("/foo/{param:custom}");

        expect($urlRouter.href(matcher, { param: 1138 })).toBe("#/foo/1138");
        expect($urlRouter.href(matcher, { param: 5 })).toBeNull();
      });

      it("should handle the new html5Mode object config from Angular 1.3", function ($urlRouter) {
        $lp.html5Mode({
          enabled: false,
        });

        expect($urlRouter.href($umf.compile("/hello"))).toBe("#/hello");
      });

      it("should return URLs with #fragments", function ($urlRouter) {
        // html5mode disabled
        $lp.html5Mode(false);
        expect(html5Compat($lp.html5Mode())).toBe(false);
        expect(
          $urlRouter.href($umf.compile("/hello/:name"), {
            name: "world",
            "#": "frag",
          }),
        ).toBe("#/hello/world#frag");

        // html5mode enabled
        $lp.html5Mode(true);
        expect(html5Compat($lp.html5Mode())).toBe(true);
        expect(
          $urlRouter.href($umf.compile("/hello/:name"), {
            name: "world",
            "#": "frag",
          }),
        ).toBe("/hello/world#frag");
      });

      it("should return URLs with #fragments when html5Mode is true & browser does not support pushState", function ($urlRouter) {
        $lp.html5Mode(true);
        $s["history"] = false;
        expect(html5Compat($lp.html5Mode())).toBe(true);
        expect(
          $urlRouter.href($umf.compile("/hello/:name"), {
            name: "world",
            "#": "frag",
          }),
        ).toBe("#/hello/world#frag");
      });
    });
  });
});
