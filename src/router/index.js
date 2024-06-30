import {
  $routerProvider,
  getProviderFor,
  getStateProvider,
  router,
  runBlock,
  watchDigests,
} from "./services";
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

export function initRouter() {
  window.angular
    .module("ng.router", ["ng"])
    .provider("$router", $routerProvider)
    .provider("$urlService", getProviderFor("urlService"))
    .provider("$urlMatcherFactory", [
      "$routerProvider",
      function RouterProvide() {
        return router.urlMatcherFactory;
      },
    ])
    .provider("$templateFactory", TemplateFactory)
    .provider("$stateRegistry", getProviderFor("stateRegistry"))
    .provider("$routerGlobals", getProviderFor("globals"))
    .provider("$transitions", getProviderFor("transitionService"))
    .provider("$state", ["$routerProvider", getStateProvider])
    .provider("$ngViewScroll", $ViewScrollProvider)
    .factory("$stateParams", [
      "$router",
      function ($router) {
        return $router.globals.params;
      },
    ])
    .factory("$view", function () {
      return router.viewService;
    })
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
