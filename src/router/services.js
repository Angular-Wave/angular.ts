/**
 * # Angular 1 types
 *
 * ng-router core provides various Typescript types which you can use for code completion and validating parameter values, etc.
 * The customizations to the core types for ng-router are documented here.
 *
 * The optional [[$resolve]] service is also documented here.
 *
 * @preferred @publicapi @module ng1
 */
import { services } from "./common/coreservices";
import { applyPairs, unnestR } from "../shared/common";
import { isString } from "../shared/utils";
import { trace } from "./common/trace";
import { UIRouter } from "./router";
import { getNg1ViewConfigFactory } from "./state/views";
import { StateProvider } from "./state-provider";

/** @type {angular.UIRouter}} */
export let router = null;
$routerProvider.$inject = ["$locationProvider"];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
export function $routerProvider($locationProvider) {
  // Create a new instance of the Router when the $routerProvider is initialized
  router = this.router = new UIRouter($locationProvider);
  router.stateProvider = new StateProvider(
    router.stateRegistry,
    router.stateService,
  );
  router.viewService._pluginapi._viewConfigFactory(
    "ng1",
    getNg1ViewConfigFactory(),
  );
  // Disable decoding of params by UrlMatcherFactory because $location already handles this
  router.urlService.config._decodeParams = false;

  /**
   * Applys ng1-specific path parameter encoding
   *
   * The Angular 1 `$location` service is a bit weird.
   * It doesn't allow slashes to be encoded/decoded bi-directionally.
   *
   * See the writeup at https://github.com/angular-ui/ui-router/issues/2598
   *
   * This code patches the `path` parameter type so it encoded/decodes slashes as ~2F
   *
   */
  const pathType = router.urlMatcherFactory.type("path");
  pathType.encode = (x) =>
    x != null
      ? x.toString().replace(/(~|\/)/g, (m) => ({ "~": "~~", "/": "~2F" })[m])
      : x;
  pathType.decode = (x) =>
    x != null
      ? x.toString().replace(/(~~|~2F)/g, (m) => ({ "~~": "~", "~2F": "/" })[m])
      : x;

  // backwards compat: also expose router instance as $routerProvider.router
  router["router"] = router;
  router["$get"] = $get;
  $get.$inject = ["$location", "$browser", "$rootScope", "$injector"];
  function $get($location, $browser, $rootScope, $injector) {
    router.stateRegistry.init($injector);
    router.urlService._runtimeServices($rootScope, $location, $browser);
    return router;
  }
  return router;
}
export const getProviderFor = (serviceName) => [
  "$routerProvider",
  function UrlServiceProvider($urp) {
    const service = $urp.router[serviceName];
    service["$get"] = () => service;
    return service;
  },
];
// This effectively calls $get() on `$routerProvider` to trigger init (when ng enters runtime)
runBlock.$inject = ["$injector", "$q", "$router"];
export function runBlock($injector, $q, $router) {
  services.$injector = $injector;
  services.$q = $q;
  // https://github.com/angular-ui/ui-router/issues/3678
  if (!Object.prototype.hasOwnProperty.call($injector, "strictDi")) {
    try {
      $injector.invoke(() => {});
    } catch (error) {
      $injector.strictDi = !!/strict mode/.exec(error && error.toString());
    }
  }
  // The $injector is now available.
  // Find any resolvables that had dependency annotation deferred
  $router.stateRegistry
    .get()
    .map((x) => x.$$state().resolvables)
    .reduce(unnestR, [])
    .filter((x) => x.deps === "deferred")
    .forEach(
      (resolvable) =>
        (resolvable.deps = $injector.annotate(
          resolvable.resolveFn,
          $injector.strictDi,
        )),
    );
  // TODO: Is this the best place for this?
  $router.urlService.listen();
}

// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
export function getStateProvider() {
  return Object.assign(router.stateProvider, {
    $get: () => router.stateService,
  });
}

watchDigests.$inject = ["$rootScope"];
export function watchDigests($rootScope) {
  $rootScope.$watch(function () {
    trace.approximateDigests++;
  });
}

/** @hidden TODO: find a place to move this */
export const getLocals = (ctx) => {
  const tokens = ctx.getTokens().filter(isString);
  const tuples = tokens.map((key) => {
    const resolvable = ctx.getResolvable(key);
    const waitPolicy = ctx.getPolicy(resolvable).async;
    return [
      key,
      waitPolicy === "NOWAIT" ? resolvable.promise : resolvable.data,
    ];
  });
  return tuples.reduce(applyPairs, {});
};
