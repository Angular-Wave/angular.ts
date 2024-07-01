import { TransitionService } from "./transition/transition-service";
import { ViewService } from "./view/view";
import { StateRegistry } from "./state/state-registry";
import { StateService } from "./state/state-service";
import { UIRouterGlobals } from "./globals";
import { UrlService } from "./url/url-service";
import { trace } from "./common/trace";
import { UrlRuleFactory } from "./url/url-rule";
import { registerLazyLoadHook } from "./hooks/lazy-load";
import { registerUpdateUrl } from "./hooks/url";
import { registerActivateViews } from "./hooks/views";
import { registerRedirectToHook } from "./hooks/redirect-to";

/**
 * Router id tracker
 * @type {number}
 */
let routerId = 0;

/**
 * An instance of ng-router.
 * @class
 *
 * This object contains references to service APIs which define your application's routing behavior.
 */
export class UIRouter {
  /**
   * Creates a new `UIRouter` object
   *
   * @param {angular.ILocationProvider} $locationProvider
   */
  constructor($locationProvider) {
    /**  @type {number} */
    this.$id = routerId++;

    /** Enable/disable tracing to the javascript console */
    this.trace = trace;
    this.$locationProvider = $locationProvider;

    /** Provides services related to ui-view synchronization */
    this.viewService = new ViewService(routerId);

    /** @type {UIRouterGlobals} An object that contains global router state, such as the current state and params */
    this.globals = new UIRouterGlobals();

    /** @type {TransitionService}  A service that exposes global Transition Hooks */
    this.transitionService = new TransitionService(
      this.globals,
      this.viewService,
    );

    /** @type {StateService} Provides services related to states */
    this.stateService = new StateService(this.globals, this.transitionService);

    /** Provides services related to the URL */
    let urlRuleFactory = new UrlRuleFactory(
      this.urlMatcherFactory,
      this.stateService,
      this.globals,
    );

    /**
     * @type {angular.UrlService}
     */
    this.urlService = new UrlService(
      $locationProvider,
      urlRuleFactory,
      this.stateService,
    );

    /** Provides a registry for states, and related registration services */
    this.stateRegistry = new StateRegistry(this.urlService);

    // Manual wiring ideally we would want to do this at runtime
    this.stateService.stateRegistry = this.stateRegistry;
    this.stateService.urlService = this.urlService; // <-- NOTE: circular dependency

    // Lazy load state trees
    this.transitionService._deregisterHookFns.lazyLoad = registerLazyLoadHook(
      this.transitionService,
      this.stateService,
      this.urlService,
      this.stateRegistry,
    );

    // After globals.current is updated at priority: 10000
    this.transitionService._deregisterHookFns.updateUrl = registerUpdateUrl(
      this.transitionService,
      this.stateService,
      this.urlService,
    );

    // Wire up redirectTo hook
    this.transitionService._deregisterHookFns.redirectTo =
      registerRedirectToHook(this.transitionService, this.stateService);

    this.transitionService._deregisterHookFns.activateViews =
      registerActivateViews(this.transitionService, this.viewService);
    this.viewService._pluginapi._rootViewContext(this.stateRegistry.root());
    this.globals.$current = this.stateRegistry.root();
    this.globals.current = this.globals.$current.self;
  }
}
