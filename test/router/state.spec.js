import { dealoc } from "../../src/jqLite";
import { Angular } from "../../src/loader";
import { publishExternalAPI } from "../../src/public";
import { isFunction } from "../../src/shared/utils";

describe("$state", () => {
  let $uiRouter,
    $injector,
    locationProvider,
    templateParams,
    template,
    ctrlName,
    errors,
    $provide,
    $compile,
    module;

  /** @type {import("../../src/router/stateProvider").StateProvider} */
  let $stateProvider;

  function $get(what) {
    return $injector.get(what);
  }

  async function initStateTo(state, params) {
    const $state = $get("$state"),
      $q = $get("$q");
    return $state.transitionTo(state, params || {});
  }

  const A = {
      name: "A",
      data: {},
      controller: function () {
        log += "controller;";
      },
      template: "a",
    },
    B = { name: "B", template: "b" },
    C = { name: "C", template: "c" },
    D = { name: "D", params: { x: null, y: null }, template: "d" },
    DD = {
      name: "DD",
      parent: D,
      params: { x: null, y: null, z: null },
      template: "dd",
    },
    DDDD = {
      name: "DDDD",
      parent: D,
      controller: function () {},
      template: "hey",
    },
    E = { name: "E", params: { i: {} }, template: "e" },
    F = {
      name: "F",
      params: { a: "", b: false, c: 0, d: undefined, e: -1 },
      template: "f",
    },
    H = { name: "H", data: { propA: "propA", propB: "propB" }, template: "h" },
    HH = { name: "HH", parent: H, template: "hh" },
    HHH = {
      name: "HHH",
      parent: HH,
      data: { propA: "overriddenA", propC: "propC" },
      template: "hhh",
    },
    RS = {
      name: "RS",
      url: "^/search?term",
      reloadOnSearch: false,
      template: "rs",
    },
    OPT = {
      name: "OPT",
      url: "/opt/:param",
      params: { param: "100" },
      template: "opt",
    },
    OPT2 = {
      name: "OPT2",
      url: "/opt2/:param2/:param3",
      params: { param3: "300", param4: "400" },
      template: "opt2",
    },
    ISS2101 = {
      name: "ISS2101",
      params: { bar: { squash: false, value: "qux" } },
      url: "/2101/{bar:string}",
    },
    URLLESS = {
      name: "URLLESS",
      url: "/urllessparams",
      params: { myparam: { type: "int" } },
    },
    AppInjectable = {};

  let log, logEvents, logEnterExit;
  function callbackLogger(state, what) {
    return function () {
      if (logEnterExit) log += state.name + "." + what + ";";
    };
  }

  window.angular = new Angular();
  publishExternalAPI();

  afterEach(() => {
    dealoc(document.getElementById("dummy"));
  });

  describe("provider", () => {
    beforeEach(() => {
      module = window.angular.module("defaultModule", ["ui.router"]);
      module.config((_$stateProvider_, _$provide_) => {
        $stateProvider = _$stateProvider_;
      });
      angular.bootstrap(document.getElementById("dummy"), ["defaultModule"]);
    });

    afterEach(() => {
      dealoc(document.getElementById("dummy"));
    });

    it("should be available at config", () => {
      expect($stateProvider).toBeDefined();
    });

    it("should should not allow states that are already registerred", () => {
      expect(() => {
        $stateProvider.state({ name: "toString", url: "/to-string" });
      }).not.toThrow();
      expect(() => {
        $stateProvider.state({ name: "toString", url: "/to-string" });
      }).toThrowError(/stateinvalid/);
    });

    it("should should not allow states that have invalid keys", () => {
      expect(() => {
        $stateProvider.state({ name: "faulty", faulturl: "/to-string" });
      }).toThrowError(/stateinvalid/);
    });

    it("should requred `name` if state definition object is passed", () => {
      expect(() => {
        $stateProvider.state({ url: "/to-string" });
      }).toThrowError(/stateinvalid/);
      expect(() => {
        $stateProvider.state({ name: "hasName", url: "/to-string" });
      }).not.toThrowError(/stateinvalid/);
    });
  });

  describe(".transitionTo()", function () {
    let $rootScope, $state, $stateParams, $transitions, $q, $location;

    beforeEach(() => {
      module = window.angular.module("defaultModule", ["ui.router"]);
      module.config((_$stateProvider_, _$provide_) => {
        $stateProvider = _$stateProvider_;
        $provide = _$provide_;

        [A, B, C, D, DD, E, H, HH, HHH].forEach(function (state) {
          state.onEnter = callbackLogger(state, "onEnter");
          state.onExit = callbackLogger(state, "onExit");
        });

        $stateProvider
          .state(A)
          .state(B)
          .state(C)
          .state(D)
          .state(DD)
          .state(DDDD)
          .state(E)
          .state(F)
          .state(H)
          .state(HH)
          .state(HHH)
          .state(RS)
          .state(OPT)
          .state(OPT2)
          .state(ISS2101)
          .state(URLLESS)
          .state({ name: "home", url: "/" })
          .state({ name: "home.item", url: "front/:id" })
          .state({
            name: "about",
            url: "/about",
            resolve: {
              stateInfo: function ($transition$) {
                return [$transition$.from().name, $transition$.to().name];
              },
            },
            onEnter: function (stateInfo) {
              log = stateInfo.join(" => ");
            },
          })
          .state({ name: "about.person", url: "/:person" })
          .state({ name: "about.person.item", url: "/:id" })
          .state({ name: "about.sidebar" })
          .state({
            name: "about.sidebar.item",
            url: "/:item",
            templateUrl: function (params) {
              templateParams = params;
              return "/templates/" + params.item + ".html";
            },
          })
          .state({
            name: "dynamicTemplate",
            url: "/dynamicTemplate/:type",
            templateProvider: function ($stateParams, foo) {
              template = $stateParams.type + foo + "Template";
              return template;
            },
            resolve: {
              foo: function () {
                return "Foo";
              },
            },
          })
          .state({
            name: "dynamicController",
            url: "/dynamicController/:type",
            template: "a",
            controllerProvider: [
              "$stateParams",
              function ($stateParams) {
                ctrlName = $stateParams.type + "Controller";
                return ctrlName;
              },
            ],
          })
          .state({
            name: "home.redirect",
            url: "redir",
            onEnter: function ($state) {
              $state.transitionTo("about");
            },
          })
          .state({
            name: "resolveFail",
            url: "/resolve-fail",
            resolve: {
              badness: function ($q) {
                return $q.reject("!");
              },
            },
            onEnter: function (badness) {},
          })
          .state({
            name: "resolveTimeout",
            url: "/resolve-timeout/:foo",
            resolve: {
              value: function ($timeout) {
                return $timeout(function () {
                  log += "Success!";
                }, 1);
              },
            },
            onEnter: function (value) {},
            template: "-",
            controller: function () {
              log += "controller;";
            },
          })
          .state({ name: "badParam", url: "/bad/{param:int}" })
          .state({ name: "badParam2", url: "/bad2/{param:[0-9]{5}}" })

          .state({ name: "json", url: "/jsonstate/{param:json}" })

          .state({ name: "first", url: "^/first/subpath" })
          .state({ name: "second", url: "^/second" })

          // State param inheritance tests. param1 is inherited by sub1 & sub2;
          // param2 should not be transferred (unless explicitly set).
          .state({ name: "root", url: "^/root?param1" })
          .state({ name: "root.sub1", url: "/1?param2" })
          .state({
            name: "logA",
            url: "/logA",
            template: "<div> <div ui-view/></div>",
            controller: function () {
              log += "logA;";
            },
          })
          .state({
            name: "logA.logB",
            url: "/logB",
            views: {
              $default: {
                template: "<div> <div ui-view/></div>",
                controller: function () {
                  log += "logB;";
                },
              },
            },
          })
          .state({
            name: "logA.logB.logC",
            url: "/logC",
            views: {
              $default: {
                template: "<div> <div ui-view/></div>",
                controller: function () {
                  log += "logC;";
                },
              },
            },
          })
          .state({ name: "root.sub2", url: "/2?param2" });

        $provide.value("AppInjectable", AppInjectable);
      });
      $injector = angular.bootstrap(document.getElementById("dummy"), [
        "defaultModule",
      ]);

      $injector.invoke(
        (
          _$rootScope_,
          _$state_,
          _$stateParams_,
          _$transitions_,
          _$q_,
          _$location_,
          _$compile_,
        ) => {
          $rootScope = _$rootScope_;
          $state = _$state_;
          $stateParams = _$stateParams_;
          $transitions = _$transitions_;
          $q = _$q_;
          $location = _$location_;
          $compile = _$compile_;
        },
      );
    });

    it("returns a promise for the target state", () => {
      const promise = $state.transitionTo(A, {});
      expect(isFunction(promise.then)).toBeTruthy();
      expect(promise.transition.to()).toBe(A);
    });

    it("returns a promise for the target state", () => {
      const promise = $state.transitionTo(A, {});
      expect(isFunction(promise.then)).toBeTruthy();
      expect(promise.transition.to()).toBe(A);
    });

    it("show return promise with an error on invalid state", (done) => {
      let res = $state.transitionTo("about.person.item", { id: 5 });
      setTimeout(() => {
        expect(res.$$state.status).toEqual(2);
        done();
      }, 100);
    });

    it("allows transitions by name", (done) => {
      $state.transitionTo("A", {});
      setTimeout(() => {
        expect($state.current).toBe(A);
        done();
      });
    });

    describe("dynamic transitions", function () {
      let dynlog, paramsChangedLog;
      let dynamicstate, childWithParam, childNoParam;

      beforeEach(async () => {
        dynlog = paramsChangedLog = "";
        dynamicstate = {
          name: "dyn",
          url: "^/dynstate/:path/:pathDyn?search&searchDyn",
          params: {
            pathDyn: { dynamic: true },
            searchDyn: { dynamic: true },
          },
          template: "dyn state. <div ui-view></div>",
          controller: function () {
            this.uiOnParamsChanged = function (updatedParams) {
              const paramNames = Object.keys(updatedParams).sort();
              const keyValues = paramNames.map(function (key) {
                return key + "=" + updatedParams[key];
              });
              dynlog += "[" + keyValues.join(",") + "];";
              paramsChangedLog += paramNames.join(",") + ";";
            };
          },
        };

        childWithParam = {
          name: "dyn.child",
          url: "/child",
          params: {
            config: "c1", // allow empty
            configDyn: { value: null, dynamic: true },
          },
          template: "dyn.child state",
          controller: function () {
            this.uiOnParamsChanged = function (updatedParams) {
              const paramNames = Object.keys(updatedParams).sort();
              const keyValues = paramNames.map(function (key) {
                return key + "=" + updatedParams[key];
              });
              dynlog += "{" + keyValues.join(",") + "};";
              paramsChangedLog += paramNames.join(",") + ";";
            };
          },
        };

        childNoParam = {
          name: "dyn.noparams",
          url: "/noparams",
          template: "dyn.noparams state",
          controller: function () {
            this.uiOnParamsChanged = function (updatedParams) {
              const paramNames = Object.keys(updatedParams).sort();
              const keyValues = paramNames.map(function (key) {
                return key + "=" + updatedParams[key];
              });
              dynlog += "<" + keyValues.join(",") + ">;";
              paramsChangedLog += paramNames.join(",") + ";";
            };
          },
        };

        $stateProvider.state(dynamicstate);
        $stateProvider.state(childWithParam);
        $stateProvider.state(childNoParam);

        $transitions.onEnter({}, function (trans, state) {
          dynlog += "enter:" + state.name + ";";
        });
        $transitions.onExit({}, function (trans, state) {
          dynlog += "exit:" + state.name + ";";
        });
        $transitions.onSuccess({}, function () {
          dynlog += "success;";
        });

        $compile("<div><ui-view></ui-view></div>")($rootScope.$new());
        await initStateTo(dynamicstate, {
          path: "p1",
          pathDyn: "pd1",
          search: "s1",
          searchDyn: "sd1",
        });
        expect(dynlog).toBe("enter:dyn;success;");
        // dynlog = '';
        // expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
        // expect($location.url()).toEqual('/dynstate/p1/pd1?search=s1&searchDyn=sd1');
      });

      describe("[ transition.dynamic() ]:", function () {
        it("is considered fully dynamic when only dynamic params have changed", function () {
          const promise = $state.go(".", { pathDyn: "pd2", searchDyn: "sd2" });
          expect(promise.transition.dynamic()).toBeTruthy();
        });

        it("is not considered fully dynamic if any state is entered", function () {
          const promise = $state.go(childWithParam);
          expect(promise.transition.dynamic()).toBeFalsy();
        });

        it("is not considered fully dynamic if any state is exited", async function () {
          await initStateTo(childWithParam, {
            config: "p1",
            path: "p1",
            pathDyn: "pd1",
            search: "s1",
            searchDyn: "sd1",
          });
          const promise = $state.go(dynamicstate);
          expect(promise.transition.dynamic()).toBeFalsy();
        });

        it("is not considered fully dynamic if any state is reloaded", function () {
          const promise = $state.go(dynamicstate, null, { reload: true });
          expect(promise.transition.dynamic()).toBeFalsy();
        });

        it("is not considered fully dynamic if any non-dynamic parameter changes", function () {
          const promise = $state.go(dynamicstate, { path: "p2" });
          expect(promise.transition.dynamic()).toBeFalsy();
        });
      });

      // describe('[ promises ]', function () {
      //   it('runs successful transition when fully dynamic', function () {
      //     let transSuccess,
      //       promise = $state.go(dynamicstate, { searchDyn: 'sd2' }),
      //       transition = promise.transition;
      //     transition.promise.then(function (result) {
      //       transSuccess = true;
      //     });
      //     $q.flush();
      //     expect(transition.dynamic()).toBeTruthy();
      //     expect(transSuccess).toBeTruthy();
      //     expect(dynlog).toBe('success;[searchDyn=sd2];');
      //   });

      //   it('resolves the $state.go() promise with the original/final state, when fully dynamic', function () {
      //     initStateTo(dynamicstate, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
      //     let destState,
      //       promise = $state.go(dynamicstate, { pathDyn: 'pd2', searchDyn: 'sd2' });
      //     promise.then(function (result) {
      //       destState = result;
      //     });
      //     $q.flush();
      //     expect(promise.transition.dynamic()).toBeTruthy();
      //     expect($state.current).toBe(dynamicstate);
      //     expect(destState).toBe(dynamicstate);
      //   });
      // });

      // describe('[ enter/exit ]', function () {
      //   it('does not exit nor enter any states when fully dynamic', function () {
      //     const promise = $state.go(dynamicstate, { searchDyn: 'sd2' });
      //     $q.flush();
      //     expect(promise.transition.dynamic()).toBeTruthy();
      //     expect(promise.transition.treeChanges().entering.length).toBe(0);
      //     expect(promise.transition.treeChanges().exiting.length).toBe(0);
      //     expect(promise.transition.treeChanges().retained.length).toBe(2);
      //     expect(dynlog).toBe('success;[searchDyn=sd2];');
      //     expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd2' });
      //   });

      //   it('does not exit nor enter the state when only dynamic search params change', function () {
      //     const promise = $state.go(dynamicstate, { searchDyn: 'sd2' });
      //     $q.flush();
      //     expect(promise.transition.dynamic()).toBeTruthy();
      //     expect(dynlog).toBe('success;[searchDyn=sd2];');
      //     expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd2' });
      //   });

      //   it('does not exit nor enter the state when only dynamic path params change', function () {
      //     const promise = $state.go(dynamicstate, { pathDyn: 'pd2' });
      //     $q.flush();
      //     expect(promise.transition.dynamic()).toBeTruthy();
      //     expect(dynlog).toBe('success;[pathDyn=pd2];');
      //     expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd2', search: 's1', searchDyn: 'sd1' });
      //   });

      //   it('exits and enters a state when a non-dynamic search param changes', function () {
      //     const promise = $state.go(dynamicstate, { search: 's2' });
      //     $q.flush();
      //     expect(promise.transition.dynamic()).toBeFalsy();
      //     expect(dynlog).toBe('exit:dyn;enter:dyn;success;');
      //     expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's2', searchDyn: 'sd1' });
      //   });

      //   it('exits and enters a state when a non-dynamic path param changes', function () {
      //     const promise = $state.go(dynamicstate, { path: 'p2' });
      //     $q.flush();
      //     expect(promise.transition.dynamic()).toBeFalsy();
      //     expect(dynlog).toBe('exit:dyn;enter:dyn;success;');
      //     expect(obj($stateParams)).toEqual({ path: 'p2', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
      //   });

      //   it('does not exit nor enter a state when only dynamic params change (triggered via url)', function () {
      //     $location.search({ search: 's1', searchDyn: 'sd2' });
      //     $rootScope.$broadcast('$locationChangeSuccess');
      //     $q.flush();
      //     expect(dynlog).toBe('success;[searchDyn=sd2];');
      //   });

      //   it('exits and enters a state when any non-dynamic params change (triggered via url)', function () {
      //     $location.search({ search: 's2', searchDyn: 'sd2' });
      //     $rootScope.$broadcast('$locationChangeSuccess');
      //     $q.flush();
      //     expect(dynlog).toBe('exit:dyn;enter:dyn;success;');
      //   });

      //   it('does not exit nor enter a state when only dynamic params change (triggered via $state transition)', function () {
      //     $state.go('.', { searchDyn: 'sd2' }, { inherit: true });
      //     $q.flush();
      //     expect(dynlog).toBe('success;[searchDyn=sd2];');
      //   });
      // });

      // describe('[ global $stateParams service ]', function () {
      //   it('updates the global $stateParams object', function () {
      //     $state.go(dynamicstate, { searchDyn: 'sd2' });
      //     $q.flush();
      //     expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd2' });
      //   });

      //   it('updates $stateParams and $location.search when only dynamic params change (triggered via url)', function () {
      //     $location.search({ search: 's1', searchDyn: 'sd2' });
      //     $rootScope.$broadcast('$locationChangeSuccess');
      //     $q.flush();
      //     expect($stateParams.search).toBe('s1');
      //     expect($stateParams.searchDyn).toBe('sd2');
      //     expect($location.search()).toEqual({ search: 's1', searchDyn: 'sd2' });
      //   });

      //   it('updates $stateParams and $location.search when only dynamic params change (triggered via $state transition)', function () {
      //     $state.go('.', { searchDyn: 'sd2' });
      //     $q.flush();
      //     expect($stateParams.search).toBe('s1');
      //     expect($stateParams.searchDyn).toBe('sd2');
      //     expect($location.search()).toEqual({ search: 's1', searchDyn: 'sd2' });
      //   });

      //   it('dynamic param changes can be observed by watching the global $stateParams', function () {
      //     let observedParamValue;
      //     function stateParamsTerm() {
      //       return $stateParams.searchDyn;
      //     }
      //     $rootScope.$watch(stateParamsTerm, function (newval, oldval) {
      //       if (newval === oldval) return;
      //       observedParamValue = newval;
      //     });
      //     $q.flush();

      //     $location.search({ search: 's1', searchDyn: 'sd2' });
      //     $rootScope.$broadcast('$locationChangeSuccess');
      //     $q.flush();
      //     expect(observedParamValue).toBe('sd2');
      //   });
      // });

      // describe('[ uiOnParamsChanged ]', function () {
      //   it('should be called when dynamic parameter values change', function () {
      //     $state.go('.', { searchDyn: 'sd2' });
      //     $q.flush();
      //     expect(paramsChangedLog).toBe('searchDyn;');
      //   });

      //   it("should not be called if a non-dynamic parameter changes (causing the controller's state to exit/enter)", function () {
      //     $state.go('.', { search: 's2', searchDyn: 'sd2' });
      //     $q.flush();
      //     expect(paramsChangedLog).toBe('');
      //   });

      //   it('should not be called, when entering a new state, if no parameter values change', function () {
      //     $state.go(childNoParam);
      //     $q.flush();
      //     expect(paramsChangedLog).toBe('');
      //   });

      //   it('should be called, when entering a new state, if any dynamic parameter value changed', function () {
      //     $state.go(childNoParam, { searchDyn: 'sd2' });
      //     $q.flush();
      //     expect(paramsChangedLog).toBe('searchDyn;');
      //   });

      //   it('should be called, when entering a new state, if a new parameter value is added', function () {
      //     $state.go(childWithParam, { config: 'c2' });
      //     $q.flush();
      //     expect(paramsChangedLog).toBe('config,configDyn;');
      //   });

      //   it('should be called, when reactivating the uiOnParamsChanged state, if a dynamic parameter changed', function () {
      //     initStateTo(childNoParam, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
      //     dynlog = paramsChangedLog = '';

      //     $state.go(dynamicstate, { pathDyn: 'pd2' });
      //     $q.flush();
      //     expect(paramsChangedLog).toBe('pathDyn;');
      //   });

      //   it('should not be called, when reactivating the uiOnParamsChanged state "dyn", if any of dyns non-dynamic parameters changed', function () {
      //     initStateTo(childNoParam, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
      //     dynlog = paramsChangedLog = '';

      //     $state.go(dynamicstate, { path: 'p2' });
      //     $q.flush();
      //     expect(paramsChangedLog).toBe('');
      //   });

      //   it('should be called with an object containing only the changed params', function () {
      //     $state.go(dynamicstate, { pathDyn: 'pd2' });
      //     $q.flush();
      //     expect(dynlog).toBe('success;[pathDyn=pd2];');

      //     $state.go(dynamicstate, { pathDyn: 'pd3', searchDyn: 'sd2' });
      //     $q.flush();
      //     expect(dynlog).toBe('success;[pathDyn=pd2];success;[pathDyn=pd3,searchDyn=sd2];');
      //   });

      //   it('should be called on all active controllers that have a uiOnParamsChanged', function () {
      //     initStateTo(childWithParam, {
      //       path: 'p1',
      //       pathDyn: 'pd1',
      //       search: 's1',
      //       searchDyn: 'sd1',
      //       config: 'p1',
      //       configDyn: 'c1',
      //     });
      //     dynlog = paramsChangedLog = '';

      //     $state.go(childWithParam, { pathDyn: 'pd2' });
      //     $q.flush();
      //     expect(dynlog).toBe('success;[pathDyn=pd2];{pathDyn=pd2};');

      //     dynlog = paramsChangedLog = '';
      //     $state.go(childWithParam, { pathDyn: 'pd2', searchDyn: 'sd2', configDyn: 'cd2' });
      //     $q.flush();
      //     expect(dynlog).toBe('success;[configDyn=cd2,searchDyn=sd2];{configDyn=cd2,searchDyn=sd2};');
      //   });
      // });
    });

    // describe('(with dynamic params because reloadOnSearch=false)', function () {
    //   describe('and only query params changed', function () {
    //     let entered = false;
    //     beforeEach(function () {
    //       initStateTo(RS);
    //       $transitions.onEnter({ entering: 'RS' }, function () {
    //         entered = true;
    //       });
    //     });

    //     it("doesn't re-enter state (triggered by url change)", function () {
    //       $location.search({ term: 'hello' });
    //       $rootScope.$broadcast('$locationChangeSuccess');
    //       $q.flush();
    //       expect($location.search()).toEqual({ term: 'hello' });
    //       expect(entered).toBeFalsy();
    //     });

    //     it("doesn't re-enter state (triggered by $state transition)", function () {
    //       initStateTo(RS);
    //       const promise = $state.go('.', { term: 'hello' });
    //       let success = false,
    //         transition = promise.transition;
    //       transition.promise.then(function () {
    //         success = true;
    //       });
    //       $q.flush();
    //       expect($state.current).toBe(RS);
    //       expect(entered).toBeFalsy();
    //       expect(success).toBeTruthy();
    //       expect($location.search()).toEqual({ term: 'hello' });
    //     });

    //     it('updates $stateParams', function () {
    //       initStateTo(RS);
    //       $location.search({ term: 'hello' });
    //       $rootScope.$broadcast('$locationChangeSuccess');
    //       $q.flush();
    //       expect(obj($stateParams)).toEqual({ term: 'hello' });
    //       expect(entered).toBeFalsy();
    //     });

    //     it('updates URL when (triggered by $state transition)', function () {
    //       initStateTo(RS);
    //       $state.go('.', { term: 'goodbye' });
    //       $q.flush();
    //       expect(obj($stateParams)).toEqual({ term: 'goodbye' });
    //       expect($location.url()).toEqual('/search?term=goodbye');
    //       expect(entered).toBeFalsy();
    //     });
    //   });
    // });

    // it('ignores non-applicable state parameters', () => {
    //   $state.transitionTo('A', { w00t: 'hi mom!' });
    //   $q.flush();
    //   expect($state.current).toBe(A);
    // }));

    // it('is a no-op when passing the current state and identical parameters', () => {
    //   initStateTo(A);
    //   const promise = $state.transitionTo(A, {}); // no-op
    //   expect(promise).toBeDefined(); // but we still get a valid promise
    //   $q.flush();
    //   expect(resolvedValue(promise)).toBe(A);
    //   expect($state.current).toBe(A);
    //   expect(log).toBe('');
    // }));

    // it('aborts pending transitions (last call wins)', () => {
    //   initStateTo(A);
    //   logEvents = true;

    //   const superseded = $state.transitionTo(B, {});
    //   $state.transitionTo(C, {});
    //   $q.flush();
    //   expect($state.current).toBe(C);
    //   expect(resolvedError(superseded)).toBeTruthy();
    // }));

    // it('aborts pending transitions even when going back to the current state', () => {
    //   initStateTo(A);
    //   logEvents = true;

    //   const superseded = $state.transitionTo(B, {});
    //   $state.transitionTo(A, {});
    //   $q.flush();
    //   expect($state.current).toBe(A);
    //   expect(resolvedError(superseded)).toBeTruthy();
    // }));

    // it('aborts pending transitions when aborted from callbacks', () => {
    //   const superseded = $state.transitionTo('home.redirect');
    //   $q.flush();
    //   expect($state.current.name).toBe('about');
    // }));

    // it('triggers onEnter and onExit callbacks', () => {
    //   initStateTo(A);
    //   logEnterExit = true;
    //   $state.transitionTo(D, {});
    //   $q.flush();
    //   log += $state.current.name + ';';
    //   $state.transitionTo(DD, {});
    //   $q.flush();
    //   log += $state.current.name + ';';
    //   $state.transitionTo(A, {});
    //   $q.flush();
    //   expect(log).toBe(
    //     'A.onExit;' + 'D.onEnter;' + 'D;' + 'DD.onEnter;' + 'DD;' + 'DD.onExit;' + 'D.onExit;' + 'A.onEnter;'
    //   );
    // }));

    // // test for #3081
    // it('injects resolve values from the exited state into onExit', function (done) {
    //   const registry = $uiRouter.stateRegistry;
    //   registry.register({
    //     name: 'design',
    //     url: '/design',
    //     resolve: {
    //       cc: function () {
    //         return 'cc resolve';
    //       },
    //     },
    //     onExit: function (cc, $state$, $transition$) {
    //       expect($transition$.to().name).toBe('A');
    //       expect($transition$.from().name).toBe('design');

    //       expect($state$).toBe(registry.get('design'));

    //       expect(cc).toBe('cc resolve');

    //       done();
    //     },
    //   });

    //   $state.go('design');
    //   $q.flush();

    //   $state.go('A');
    //   $q.flush();
    // });

    // it("doesn't transition to parent state when child has no URL", () => {
    //   $state.transitionTo('about.sidebar');
    //   $q.flush();
    //   expect($state.current.name).toEqual('about.sidebar');
    // }));

    // it('notifies on failed relative state resolution', () => {
    //   $state.transitionTo(DD);
    //   $q.flush();

    //   let actual,
    //     err = "Could not resolve '^.Z' from state 'DD'";
    //   $state.transitionTo('^.Z', null, { relative: $state.$current }).catch(function (err) {
    //     actual = err;
    //   });
    //   $q.flush();
    //   expect(actual.detail).toEqual(err);
    // }));

    // it('uses the templateProvider to get template dynamically', () => {
    //   $state.transitionTo('dynamicTemplate', { type: 'Acme' });
    //   $q.flush();
    //   expect(template).toEqual('AcmeFooTemplate');
    // }));

    // it('uses the controllerProvider to get controller dynamically', () => {
    //   $state.transitionTo('dynamicController', { type: 'Acme' });
    //   $q.flush();
    //   expect(ctrlName).toEqual('AcmeController');
    // }));

    // it('updates the location #fragment, if specified', inject(function ($state, $q, $location) {
    //   // html5mode disabled
    //   locationProvider.html5Mode(false);
    //   expect(html5Compat(locationProvider.html5Mode())).toBe(false);
    //   $state.transitionTo('home.item', { id: 'world', '#': 'frag' });
    //   $q.flush();
    //   expect($location.url()).toBe('/front/world#frag');
    //   expect($location.hash()).toBe('frag');

    //   // html5mode enabled
    //   locationProvider.html5Mode(true);
    //   expect(html5Compat(locationProvider.html5Mode())).toBe(true);
    //   $state.transitionTo('home.item', { id: 'world', '#': 'frag' });
    //   $q.flush();
    //   expect($location.url()).toBe('/front/world#frag');
    //   expect($location.hash()).toBe('frag');
    // }));

    // it('runs a transition when the location #fragment is updated', inject(function (
    //   $state,
    //   $q,
    //   $location,
    //   $transitions
    // ) {
    //   let transitionCount = 0;
    //   $transitions.onSuccess({}, function () {
    //     transitionCount++;
    //   });

    //   $state.transitionTo('home.item', { id: 'world', '#': 'frag' });
    //   $q.flush();
    //   expect($location.hash()).toBe('frag');
    //   expect(transitionCount).toBe(1);

    //   $state.transitionTo('home.item', { id: 'world', '#': 'blarg' });
    //   $q.flush();
    //   expect($location.hash()).toBe('blarg');
    //   expect(transitionCount).toBe(2);
    // }));

    // it('injects $transition$ into resolves', () => {
    //   $state.transitionTo('home');
    //   $q.flush();
    //   $state.transitionTo('about');
    //   $q.flush();
    //   expect(log).toBe('home => about');
    // }));
  });
});
