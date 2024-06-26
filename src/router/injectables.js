/**
 * The current (or pending) State Parameters
 *
 * An injectable global **Service Object** which holds the state parameters for the latest **SUCCESSFUL** transition.
 *
 * The values are not updated until *after* a `Transition` successfully completes.
 *
 * **Also:** an injectable **Per-Transition Object** object which holds the pending state parameters for the pending `Transition` currently running.
 *
 * ### Deprecation warning:
 *
 * The value injected for `$stateParams` is different depending on where it is injected.
 *
 * - When injected into an angular service, the object injected is the global **Service Object** with the parameter values for the latest successful `Transition`.
 * - When injected into transition hooks, resolves, or view controllers, the object is the **Per-Transition Object** with the parameter values for the running `Transition`.
 *
 * Because of these confusing details, this service is deprecated.
 *
 * ### Instead of using the global `$stateParams` service object,
 * inject [[$routerGlobals]] and use [[UIRouterGlobals.params]]
 *
 * ```js
 * MyService.$inject = ['$routerGlobals'];
 * function MyService($routerGlobals) {
 *   return {
 *     paramValues: function () {
 *       return $routerGlobals.params;
 *     }
 *   }
 * }
 * ```
 *
 * ### Instead of using the per-transition `$stateParams` object,
 * inject the current `Transition` (as [[$transition$]]) and use [[Transition.params]]
 *
 * ```js
 * MyController.$inject = ['$transition$'];
 * function MyController($transition$) {
 *   var username = $transition$.params().username;
 *   // .. do something with username
 * }
 * ```
 *
 * ---
 *
 * This object can be injected into other services.
 *
 * #### Deprecated Example:
 * ```js
 * SomeService.$inject = ['$http', '$stateParams'];
 * function SomeService($http, $stateParams) {
 *   return {
 *     getUser: function() {
 *       return $http.get('/api/users/' + $stateParams.username);
 *     }
 *   }
 * };
 * angular.service('SomeService', SomeService);
 * ```
 * @deprecated
 */
let $stateParams;
/**
 * Global ng-router variables
 *
 * The router global state as a **Service Object** (injectable during runtime).
 *
 * This object contains globals such as the current state and current parameter values.
 */
let $routerGlobals;
/**
 * The ng-router instance
 *
 * The [[UIRouter]] singleton (the router instance) as a **Service Object** (injectable during runtime).
 *
 * This object is the ng-router singleton instance, created by angular dependency injection during application bootstrap.
 * It has references to the other ng-router services
 *
 * #### Note: This object is also exposed as [[$routerProvider]] for injection during angular config time.
 */
let $router;
/**
 * The ng-router instance
 *
 * The [[UIRouter]] singleton (the router instance) as a **Provider Object** (injectable during config phase).
 *
 * This object is the ng-router singleton instance, created by angular dependency injection during application bootstrap.
 * It has references to the other ng-router services
 *
 * #### Note: This object is also exposed as [[$router]] for injection during runtime.
 */
let $routerProvider;
/**
 * Transition debug/tracing
 *
 * The [[Trace]] singleton as a **Service Object** (injectable during runtime).
 *
 * Enables or disables Transition tracing which can help to debug issues.
 */
let $trace;
/**
 * The Transition Service
 *
 * The [[TransitionService]] singleton as a **Service Object** (injectable during runtime).
 *
 * This angular service exposes the [[TransitionService]] singleton, which is primarily
 * used to register global transition hooks.
 *
 * #### Note: This object is also exposed as [[$transitionsProvider]] for injection during the config phase.
 */
let $transitions;
/**
 * The Transition Service
 *
 * The [[TransitionService]] singleton as a **Provider Object** (injectable during config phase)
 *
 * This angular service exposes the [[TransitionService]] singleton, which is primarily
 * used to register global transition hooks.
 *
 * #### Note: This object is also exposed as [[$transitions]] for injection during runtime.
 */
let $transitionsProvider;
/**
 * The current [[Transition]] object
 *
 * The current [[Transition]] object as a **Per-Transition Object** (injectable into Resolve, Hooks, Controllers)
 *
 * This object returns information about the current transition, including:
 *
 * - To/from states
 * - To/from parameters
 * - Transition options
 * - States being entered, exited, and retained
 * - Resolve data
 * - A Promise for the transition
 * - Any transition failure information
 * - An injector for both Service and Per-Transition Objects
 */
let $transition$;
/**
 * The State Service
 *
 * The [[StateService]] singleton as a **Service Object** (injectable during runtime).
 *
 * This service used to manage and query information on registered states.
 * It exposes state related APIs including:
 *
 * - Start a [[Transition]]
 * - Imperatively lazy load states
 * - Check if a state is currently active
 * - Look up states by name
 * - Build URLs for a state+parameters
 * - Configure the global Transition error handler
 *
 * This angular service exposes the [[StateService]] singleton.
 */
let $state;
/**
 * The State Registry
 *
 * The [[StateRegistry]] singleton as a **Service Object** (injectable during runtime).
 *
 * This service is used to register/deregister states.
 * It has state registration related APIs including:
 *
 * - Register/deregister states
 * - Listen for state registration/deregistration
 * - Get states by name
 * - Add state decorators (to customize the state creation process)
 *
 * #### Note: This object is also exposed as [[$stateRegistryProvider]] for injection during the config phase.
 */
let $stateRegistry;
/**
 * The State Registry
 *
 * The [[StateRegistry]] singleton as a **Provider Object** (injectable during config time).
 *
 * This service is used to register/deregister states.
 * It has state registration related APIs including:
 *
 * - Register/deregister states
 * - Listen for state registration/deregistration
 * - Get states by name
 * - Add state decorators (to customize the state creation process)
 *
 * #### Note: This object is also exposed as [[$stateRegistry]] for injection during runtime.
 */
let $stateRegistryProvider;
/**
 * The View Scroll provider
 *
 * The [[UIViewScrollProvider]] as a **Provider Object** (injectable during config time).
 *
 * This angular service exposes the [[UIViewScrollProvider]] singleton and is
 * used to disable ng-router's scroll behavior.
 */
let $ngViewScrollProvider;
/**
 * The View Scroll function
 *
 * The View Scroll function as a **Service Object** (injectable during runtime).
 *
 * This is a function that scrolls an element into view.
 * The element is scrolled after a `$timeout` so the DOM has time to refresh.
 *
 * If you prefer to rely on `$anchorScroll` to scroll the view to the anchor,
 * this can be enabled by calling [[UIViewScrollProvider.useAnchorScroll]].
 *
 * Note: this function is used by the [[directives.ngView]] when the `autoscroll` expression evaluates to true.
 */
let $ngViewScroll;
/**
 * The StateProvider
 *
 * An angular1-only [[StateProvider]] as a **Provider Object** (injectable during config time).
 *
 * This angular service exposes the [[StateProvider]] singleton.
 *
 * The `StateProvider` is primarily used to register states or add custom state decorators.
 *
 * ##### Note: This provider is a ng1 vestige.
 * It is a passthrough to [[$stateRegistry]] and [[$state]].
 */
let $stateProvider;
/**
 * The URL Service Provider
 *
 * The [[UrlService]] singleton as a **Provider Object** (injectable during the angular config phase).
 *
 * A service used to configure and interact with the URL.
 * It has URL related APIs including:
 *
 * - register custom Parameter types `UrlService.config.type` ([[UrlConfigApi.type]])
 * - add URL rules: `UrlService.rules.when` ([[UrlRulesApi.when]])
 * - configure behavior when no url matches: `UrlService.rules.otherwise` ([[UrlRulesApi.otherwise]])
 * - delay initial URL synchronization [[UrlService.deferIntercept]].
 * - get or set the current url: [[UrlService.url]]
 *
 * ##### Note: This service can also be injected during runtime as [[$urlService]].
 */
let $urlServiceProvider;
/**
 * The URL Service
 *
 * The [[UrlService]] singleton as a **Service Object** (injectable during runtime).
 *
 * Note: This service can also be injected during the config phase as [[$urlServiceProvider]].
 *
 * Used to configure the URL.
 * It has URL related APIs including:
 *
 * - register custom Parameter types `UrlService.config.type` ([[UrlConfigApi.type]])
 * - add URL rules: `UrlService.rules.when` ([[UrlRulesApi.when]])
 * - configure behavior when no url matches: `UrlService.rules.otherwise` ([[UrlRulesApi.otherwise]])
 * - delay initial URL synchronization [[UrlService.deferIntercept]].
 * - get or set the current url: [[UrlService.url]]
 *
 * ##### Note: This service can also be injected during the config phase as [[$urlServiceProvider]].
 */
let $urlService;

export {};
