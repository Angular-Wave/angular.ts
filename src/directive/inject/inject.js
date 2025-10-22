import { $injectTokens as $t } from "../../injection-tokens.js";

ngInjectDirective.$inject = [$t.$parse, $t.$injector];

/**
 * @param {ng.ParseService} $parse
 * @param {ng.InjectorService} $injector
 * @returns {import('interface.ts').Directive}
 */
export function ngInjectDirective($parse, $injector) {
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
            // Attempt to resolve the injectable directly by its name
            const service = $injector.get(name);
            scope[name] = service; // expose to scope
            return name; // return same identifier so expression works
          } catch {
            console.warn(`Injectable ${name} not found in $injector`);
            return match; // leave text unchanged
          }
        },
      );
      scope.$apply(replacedExpr);
    },
  };
}
