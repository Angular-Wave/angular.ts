import {
  $uiRouterProvider,
  getUrlRouterProvider,
  getProviderFor,
  getStateProvider,
  router,
  runBlock,
  watchDigests,
} from "./adapter/services";
import { TemplateFactory } from "./adapter/templateFactory";
import { trace } from "./core/common/trace";

export function initRouter() {
  window.angular.module("ui.router.angular1", []);
  const mod_init = window.angular.module("ui.router.init", ["ng"]);
  const mod_util = window.angular.module("ui.router.util", ["ui.router.init"]);
  const mod_rtr = window.angular.module("ui.router.router", ["ui.router.util"]);
  const mod_state = window.angular.module("ui.router.state", [
    "ui.router.router",
    "ui.router.util",
    "ui.router.angular1",
  ]);
  const mod_main = window.angular.module("ui.router", [
    "ui.router.init",
    "ui.router.state",
    "ui.router.angular1",
  ]);

  mod_init.provider("$uiRouter", $uiRouterProvider);
  mod_rtr.provider("$urlRouter", ["$uiRouterProvider", getUrlRouterProvider]);
  mod_util.provider("$urlService", getProviderFor("urlService"));
  mod_util.provider("$urlMatcherFactory", [
    "$uiRouterProvider",
    () => router.urlMatcherFactory,
  ]);
  mod_util.provider("$templateFactory", () => new TemplateFactory());
  mod_state.provider("$stateRegistry", getProviderFor("stateRegistry"));
  mod_state.provider("$uiRouterGlobals", getProviderFor("globals"));
  mod_state.provider("$transitions", getProviderFor("transitionService"));
  mod_state.provider("$state", ["$uiRouterProvider", getStateProvider]);
  mod_state.factory("$stateParams", [
    "$uiRouter",
    ($uiRouter) => $uiRouter.globals.params,
  ]);
  mod_main.factory("$view", () => router.viewService);
  mod_main.service("$trace", () => trace);
  mod_main.run(watchDigests);
  mod_util.run(["$urlMatcherFactory", function ($urlMatcherFactory) {}]);
  mod_state.run(["$state", function ($state) {}]);
  mod_rtr.run(["$urlRouter", function ($urlRouter) {}]);
  mod_init.run(runBlock);
}
