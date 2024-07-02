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
import { unnestR } from "../shared/common";
import { trace } from "./common/trace";
import { UIRouter } from "./router";

/** @type {angular.UIRouter}} */
export let router = null;
$routerProvider.$inject = ["$locationProvider"];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
export function $routerProvider($locationProvider) {
  // Create a new instance of the Router when the $routerProvider is initialized
  router = this.router = new UIRouter($locationProvider);
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
runBlock.$inject = [
  "$injector",
  "$q",
  "$router",
  "$stateRegistry",
  "$urlService",
];
export function runBlock($injector, $q, $router, $stateRegistry, $urlService) {
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
  $stateRegistry
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
  // Start listening for url changes
  $urlService.listen();
}

// $state service and $stateProvider
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
