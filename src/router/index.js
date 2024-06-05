import {
  $routerProvider,
  getProviderFor,
  getStateProvider,
  router,
  runBlock,
  watchDigests,
} from "./services";
import { TemplateFactory } from "./templateFactory";
import { trace } from "./common/trace";
import { $ViewScrollProvider } from "./viewScroll";
import { $IsStateFilter, $IncludedByStateFilter } from "./stateFilters";
import {
  uiSrefActiveDirective,
  uiStateDirective,
  uiSrefDirective,
} from "./directives/stateDirectives";
import { uiView, $ViewDirectiveFill } from "./directives/viewDirective";

export function initRouter() {
  window.angular.module("ui.router.angular1", []);
  const mod_init = window.angular.module("ui.router.init", ["ng"]);
  const mod_util = window.angular.module("ui.router.util", ["ui.router.init"]);
  const mod_state = window.angular.module("ui.router.state", [
    "ui.router.util",
    "ui.router.angular1",
  ]);

  const mod_main = window.angular.module("ui.router", [
    "ui.router.init",
    "ui.router.state",
    "ui.router.angular1",
  ]);

  mod_init.provider("$router", $routerProvider);
  mod_util.provider("$urlService", getProviderFor("urlService"));
  mod_util.provider("$urlMatcherFactory", [
    "$routerProvider",
    function RouterProvide() {
      return router.urlMatcherFactory;
    },
  ]);
  mod_util.provider("$templateFactory", function () {
    return new TemplateFactory();
  });
  mod_state
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
    .filter("isState", $IsStateFilter)
    .filter("includedByState", $IncludedByStateFilter)
    .directive("uiSref", uiSrefDirective)
    .directive("uiSrefActive", uiSrefActiveDirective)
    .directive("uiSrefActiveEq", uiSrefActiveDirective)
    .directive("uiState", uiStateDirective)
    .directive("uiView", uiView)
    .directive("uiView", $ViewDirectiveFill);
  mod_main.factory("$view", function View() {
    return router.viewService;
  });
  mod_main.service("$trace", function Trace() {
    return trace;
  });
  mod_main.run(watchDigests);
  mod_util.run(["$urlMatcherFactory", function MatcherFac() {}]);
  mod_state.run(["$state", function State() {}]);
  mod_init.run(runBlock);
}
