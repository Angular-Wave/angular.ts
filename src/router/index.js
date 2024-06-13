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
  uiSrefActiveDirective,
  uiStateDirective,
  uiSrefDirective,
} from "./directives/state-directives";
import { uiView, $ViewDirectiveFill } from "./directives/view-directive";

export function initRouter() {
  window.angular
    .module("ui.router", ["ng"])
    .provider("$router", $routerProvider)
    .provider("$urlService", getProviderFor("urlService"))
    .provider("$urlMatcherFactory", [
      "$routerProvider",
      function RouterProvide() {
        return router.urlMatcherFactory;
      },
    ])
    .provider("$templateFactory", function () {
      return new TemplateFactory();
    })
    .provider("$stateRegistry", getProviderFor("stateRegistry"))
    .provider("$routerGlobals", getProviderFor("globals"))
    .provider("$transitions", getProviderFor("transitionService"))
    .provider("$state", ["$routerProvider", getStateProvider])
    .provider("$uiViewScroll", $ViewScrollProvider)
    .factory("$stateParams", [
      "$router",
      function StateParamse($router) {
        return $router.globals.params;
      },
    ])
    .factory("$view", function () {
      return router.viewService;
    })
    .value("$trace", trace)
    .filter("isState", $IsStateFilter)
    .filter("includedByState", $IncludedByStateFilter)
    .directive("uiSref", uiSrefDirective)
    .directive("uiSrefActive", uiSrefActiveDirective)
    .directive("uiSrefActiveEq", uiSrefActiveDirective)
    .directive("uiState", uiStateDirective)
    .directive("uiView", uiView)
    .directive("uiView", $ViewDirectiveFill)

    .run(watchDigests)
    .run(runBlock);
}
