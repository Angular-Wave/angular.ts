import { runBlock, watchDigests } from "./services";
import { TemplateFactory } from "./template-factory";
import { trace } from "./common/trace";
import { $ViewScrollProvider } from "./view-scroll";
import { $IsStateFilter, $IncludedByStateFilter } from "./state-filters";
import {
  ngSrefActiveDirective,
  ngStateDirective,
  ngSrefDirective,
} from "./directives/state-directives";
import { ngView, $ViewDirectiveFill } from "./directives/view-directive";
import { UrlConfigProvider } from "./url/url-config";
import { StateRegistry } from "./state/state-registry";
import { ViewService } from "./view/view";
import { UrlService } from "./url/url-service";
import { StateService } from "./state/state-service";
import { UIRouterGlobals } from "./globals";
import { TransitionService } from "./transition/transition-service";

export function initRouter() {
  window.angular
    .module("ng.router", ["ng"])
    .provider("$urlConfig", UrlConfigProvider)
    .provider("$routerGlobals", UIRouterGlobals)
    .provider("$view", ViewService)
    /** @type {TransitionService}  A service that exposes global Transition Hooks */
    .provider("$transitions", TransitionService)
    /** @type {StateService} Provides services related to states */
    .provider("$state", StateService)
    .provider("$ngViewScroll", $ViewScrollProvider)
    .provider("$templateFactory", TemplateFactory)
    .provider("$urlService", UrlService)
    /** Provides a registry for states, and related registration services */
    .provider("$stateRegistry", StateRegistry)
    .factory("$stateParams", [
      "$routerGlobals",
      function (globals) {
        return globals.params;
      },
    ])

    .value("$trace", trace)
    .filter("isState", $IsStateFilter)
    .filter("includedByState", $IncludedByStateFilter)
    .directive("ngSref", ngSrefDirective)
    .directive("ngSrefActive", ngSrefActiveDirective)
    .directive("ngSrefActiveEq", ngSrefActiveDirective)
    .directive("ngState", ngStateDirective)
    .directive("ngView", ngView)
    .directive("ngView", $ViewDirectiveFill)

    .run(watchDigests)
    .run(runBlock);
}
