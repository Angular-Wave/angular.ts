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
import { services } from "./common/coreservices";
import { applyPairs, unnestR } from "../shared/common";
import { isString } from "../shared/utils";
import { trace } from "./common/trace";
import { UIRouter } from "./router";
import { ng1ViewsBuilder, getNg1ViewConfigFactory } from "./state/views";

import { StateProvider } from "./stateProvider";
import { Ng1LocationServices } from "./locationServices";
import { ResolveContext } from "./resolve/resolveContext";

export let router = null;
$routerProvider.$inject = ["$locationProvider"];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
export function $routerProvider($locationProvider) {
  const ng1LocationService = new Ng1LocationServices($locationProvider);
  // Create a new instance of the Router when the $routerProvider is initialized
  router = this.router = new UIRouter(ng1LocationService);
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

  Ng1LocationServices.monkeyPatchPathParameterType(router);
  // backwards compat: also expose router instance as $routerProvider.router
  router["router"] = router;
  router["$get"] = $get;
  $get.$inject = ["$location", "$browser", "$rootScope"];
  function $get($location, $browser, $rootScope) {
    ng1LocationService._runtimeServices($rootScope, $location, $browser);
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

/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
 *
 * @internalapi
 */
const getStateHookBuilder = (hookName) =>
  function stateHookBuilder(stateObject) {
    const hook = stateObject[hookName];
    const pathname = hookName === "onExit" ? "from" : "to";
    function decoratedNg1Hook(trans, state) {
      const resolveContext = new ResolveContext(trans.treeChanges(pathname));
      const subContext = resolveContext.subContext(state.$$state());
      const locals = Object.assign(getLocals(subContext), {
        $state$: state,
        $transition$: trans,
      });
      return services.$injector.invoke(hook, this, locals);
    }
    return hook ? decoratedNg1Hook : undefined;
  };
