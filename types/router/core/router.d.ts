import { UrlMatcherFactory } from "./url/urlMatcherFactory";
import { UrlRouter } from "./url/urlRouter";
import { TransitionService } from "./transition/transitionService";
import { ViewService } from "./view/view";
import { StateRegistry } from "./state/stateRegistry";
import { StateService } from "./state/stateService";
import { RouterGlobals } from "./globals";
import { UrlService } from "./url/urlService";
import { LocationServices, LocationConfig } from "./common/coreservices";
import { Trace } from "./common/trace";
/**
 * An instance of Router.
 *
 * This object contains references to service APIs which define your application's routing behavior.
 */
export declare class Router {
  locationService: LocationServices;
  locationConfig: LocationConfig;
  /** @internal */ $id: number;
  /** @internal */ _disposed: boolean;
  /** @internal */ private _disposables;
  /** Enable/disable tracing to the javascript console */
  trace: Trace;
  /** Provides services related to ui-view synchronization */
  viewService: ViewService;
  /** An object that contains global router state, such as the current state and params */
  globals: RouterGlobals;
  /** A service that exposes global Transition Hooks */
  transitionService: TransitionService;
  /**
   * Deprecated for public use. Use [[urlService]] instead.
   * @deprecated Use [[urlService]] instead
   */
  urlMatcherFactory: UrlMatcherFactory;
  /**
   * Deprecated for public use. Use [[urlService]] instead.
   * @deprecated Use [[urlService]] instead
   */
  urlRouter: UrlRouter;
  /** Provides services related to the URL */
  urlService: UrlService;
  /** Provides a registry for states, and related registration services */
  stateRegistry: StateRegistry;
  /** Provides services related to states */
  stateService: StateService;
  /**
   * Creates a new `Router` object
   *
   * @param locationService a [[LocationServices]] implementation
   * @param locationConfig a [[LocationConfig]] implementation
   * @internal
   */
  constructor(
    locationService?: LocationServices,
    locationConfig?: LocationConfig,
  );
}
