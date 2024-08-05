/**
 * # Angular 1 types
 *
 * ng-router core provides various Typescript types which you can use for code completion and validating parameter values, etc.
 * The customizations to the core types for ng-router are documented here.
 *
 * The optional [[$resolve]] service is also documented here.
 *
 */
import { services } from "./common/coreservices";
import { unnestR } from "../shared/common";
import { trace } from "./common/trace";
import { annotate } from "../core/di/injector";

runBlock.$inject = ["$injector", "$q", "$stateRegistry", "$urlService"];
export function runBlock($injector, $q, $stateRegistry, $urlService) {
  services.$injector = $injector;
  services.$q = $q;
  // https://github.com/angular-ui/ui-router/issues/3678
  if (!Object.prototype.hasOwnProperty.call($injector, "strictDi")) {
    try {
      $injector.invoke(() => {});
    } catch (error) {
      $injector.strictDi = !!/strict mode/.exec(error && error.toString());
    }
  }
  // The $injector is now available.
  // Find any resolvables that had dependency annotation deferred
  $stateRegistry
    .get()
    .map((x) => x.$$state().resolvables)
    .reduce(unnestR, [])
    .filter((x) => x.deps === "deferred")
    .forEach(
      (resolvable) =>
        (resolvable.deps = annotate(resolvable.resolveFn, $injector.strictDi)),
    );
  // Start listening for url changes
  $urlService.listen();
}

watchDigests.$inject = ["$rootScope"];
export function watchDigests($rootScope) {
  $rootScope.$watch(function () {
    trace.approximateDigests++;
  });
}
