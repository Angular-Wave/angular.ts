/**
 * # Angular 1 types
 *
 * UI-Router core provides various Typescript types which you can use for code completion and validating parameter values, etc.
 * The customizations to the core types for Angular UI-Router are documented here.
 *
 * The optional [[$resolve]] service is also documented here.
 *
 * @preferred @publicapi @module ng1
 */
import { services } from "../core/common/coreservices";
import { applyPairs, unnestR } from "../core/common/common";
import { isString, extend } from "../../core/utils";
import { trace } from "../core/common/trace";
import { UIRouter } from "../core/router";
import {
  ng1ViewsBuilder,
  getNg1ViewConfigFactory,
} from "./statebuilders/views";

import { StateProvider } from "./stateProvider";
import { getStateHookBuilder } from "./statebuilders/onEnterExitRetain";
import { Ng1LocationServices } from "./locationServices";

export let router = null;
$uiRouterProvider.$inject = ["$locationProvider"];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
export function $uiRouterProvider($locationProvider) {
  // Create a new instance of the Router when the $uiRouterProvider is initialized
  router = this.router = new UIRouter();
  router.stateProvider = new StateProvider(
    router.stateRegistry,
    router.stateService,
  );
  // Apply ng1 specific StateBuilder code for `views`, `resolve`, and `onExit/Retain/Enter` properties
  router.stateRegistry.decorator("views", ng1ViewsBuilder);
  router.stateRegistry.decorator("onExit", getStateHookBuilder("onExit"));
  router.stateRegistry.decorator("onRetain", getStateHookBuilder("onRetain"));
  router.stateRegistry.decorator("onEnter", getStateHookBuilder("onEnter"));
  router.viewService._pluginapi._viewConfigFactory(
    "ng1",
    getNg1ViewConfigFactory(),
  );
  // Disable decoding of params by UrlMatcherFactory because $location already handles this
  router.urlService.config._decodeParams = false;
  const ng1LocationService =
    (router.locationService =
    router.locationConfig =
      new Ng1LocationServices($locationProvider));
  Ng1LocationServices.monkeyPatchPathParameterType(router);
  // backwards compat: also expose router instance as $uiRouterProvider.router
  router["router"] = router;
  router["$get"] = $get;
  $get.$inject = ["$location", "$browser", "$rootScope"];
  function $get($location, $browser, $rootScope) {
    ng1LocationService._runtimeServices($rootScope, $location, $browser);
    delete router["router"];
    delete router["$get"];
    return router;
  }
  return router;
}
export const getProviderFor = (serviceName) => [
  "$uiRouterProvider",
  function UrlServiceProvider($urp) {
    const service = $urp.router[serviceName];
    service["$get"] = () => service;
    return service;
  },
];
// This effectively calls $get() on `$uiRouterProvider` to trigger init (when ng enters runtime)
runBlock.$inject = ["$injector", "$q", "$uiRouter"];
export function runBlock($injector, $q, $uiRouter) {
  services.$injector = $injector;
  services.$q = $q;
  // https://github.com/angular-ui/ui-router/issues/3678
  if (!Object.prototype.hasOwnProperty.call($injector, "strictDi")) {
    try {
      $injector.invoke(function (checkStrictDi) {});
    } catch (error) {
      $injector.strictDi = !!/strict mode/.exec(error && error.toString());
    }
  }
  // The $injector is now available.
  // Find any resolvables that had dependency annotation deferred
  $uiRouter.stateRegistry
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
}

// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
export function getStateProvider() {
  return extend(router.stateProvider, { $get: () => router.stateService });
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
