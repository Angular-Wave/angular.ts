import { $injectTokens as $t } from "../../injection-tokens.js";

ngInjectDirective.$inject = [$t.$log, $t.$injector];

/**
 * @param {ng.LogService} $log
 * @param {ng.InjectorService} $injector
 * @returns {import('interface.ts').Directive}
 */
export function ngInjectDirective($log, $injector) {
  return {
    restrict: "A",
    link(scope, _element, attrs) {
      const expr = attrs["ngInject"];

      if (!expr) return;
      // Match any identifier that starts with $, or ends with Service/Factory
      // Example matches: $http, userService, authFactory
      const replacedExpr = expr.replace(
        /(\$[\w]+|[\w]+(?:Service|Factory))/g,
        (match, name) => {
          try {
            const service = $injector.get(name);
            scope.$target[name] = service;
            return name;
          } catch {
            $log.warn(`Injectable ${name} not found in $injector`);
            return match;
          }
        },
      );
      scope.$apply(replacedExpr);
    },
  };
}
