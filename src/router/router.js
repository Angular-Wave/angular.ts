import { UrlMatcherFactory } from "./url/url-matcher-factory";
import { UrlRouter } from "./url/url-router";
import { TransitionService } from "./transition/transition-service";
import { ViewService } from "./view/view";
import { StateRegistry } from "./state/state-registry";
import { StateService } from "./state/state-service";
import { UIRouterGlobals } from "./globals";
import { UrlService } from "./url/url-service";
import { trace } from "./common/trace";
import { UrlRuleFactory } from "./url/url-rule";

/**
 * Router id tracker
 * @type {number}
 */
let routerId = 0;

/**
 * An instance of UI-Router.
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
      this,
      this.globals,
      this.viewService,
    );
    /** Provides services related to states */
    this.stateService = new StateService(
      this,
      this.globals,
      this.transitionService,
    );
    /** Provides services related to the URL */
    let urlRuleFactory = new UrlRuleFactory(
      this.urlMatcherFactory,
      this.stateService,
      this.globals,
    );
    this.urlService = new UrlService(
      this,
      $locationProvider,
      urlRuleFactory,
      this.stateService,
    );
    /**
     * Deprecated for public use. Use [[urlService]] instead.
     * @deprecated Use [[urlService]] instead
     */
    this.urlMatcherFactory = new UrlMatcherFactory(this.urlService.config);

    /**
     * Deprecated for public use. Use [[urlService]] instead.
     * @deprecated Use [[urlService]] instead
     */
    this.urlRouter = new UrlRouter(this, urlRuleFactory);

    /** Provides a registry for states, and related registration services */
    this.stateRegistry = new StateRegistry(
      this.urlMatcherFactory,
      this.urlService.rules,
    );

    /** @internal plugin instances are registered here */
    this._plugins = {};
    this.viewService._pluginapi._rootViewContext(this.stateRegistry.root());
    this.globals.$current = this.stateRegistry.root();
    this.globals.current = this.globals.$current.self;
  }

  /**
   * Adds a plugin to UI-Router
   *
   * This method adds a UI-Router Plugin.
   * A plugin can enhance or change UI-Router behavior using any public API.
   *
   * #### Example:
   * ```js
   * import { MyCoolPlugin } from "ui-router-cool-plugin";
   *
   * var plugin = router.addPlugin(MyCoolPlugin);
   * ```
   *
   * ### Plugin authoring
   *
   * A plugin is simply a class (or constructor function) which accepts a [[UIRouter]] instance and (optionally) an options object.
   *
   * The plugin can implement its functionality using any of the public APIs of [[UIRouter]].
   * For example, it may configure router options or add a Transition Hook.
   *
   * The plugin can then be published as a separate module.
   *
   * #### Example:
   * ```js
   * export class MyAuthPlugin implements UIRouterPlugin {
   *   constructor(router: UIRouter, options: any) {
   *     this.name = "MyAuthPlugin";
   *     let $transitions = router.transitionService;
   *     let $state = router.stateService;
   *
   *     let authCriteria = {
   *       to: (state) => state.data && state.data.requiresAuth
   *     };
   *
   *     function authHook(transition: Transition) {
   *       let authService = transition.injector().get('AuthService');
   *       if (!authService.isAuthenticated()) {
   *         return $state.target('login');
   *       }
   *     }
   *
   *     $transitions.onStart(authCriteria, authHook);
   *   }
   * }
   * ```
   *
   * @param plugin one of:
   *        - a plugin class which implements [[UIRouterPlugin]]
   *        - a constructor function for a [[UIRouterPlugin]] which accepts a [[UIRouter]] instance
   *        - a factory function which accepts a [[UIRouter]] instance and returns a [[UIRouterPlugin]] instance
   * @param options options to pass to the plugin class/factory
   * @returns the registered plugin instance
   */
  plugin(plugin, options = {}) {
    const pluginInstance = new plugin(this, options);
    if (!pluginInstance.name)
      throw new Error(
        "Required property `name` missing on plugin: " + pluginInstance,
      );
    return (this._plugins[pluginInstance.name] = pluginInstance);
  }
  getPlugin(pluginName) {
    return pluginName
      ? this._plugins[pluginName]
      : Object.values(this._plugins);
  }
}
