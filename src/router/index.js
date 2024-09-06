import { runBlock } from "./services";

export function initRouter(angular) {
  angular.module("ng.router", ["ng"]).run(runBlock);
}
