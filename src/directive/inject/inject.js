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
    link: (scope, element, attrs) => {
      // Parse the expression from the attribute
      const expr = attrs["ngService"];

      if (!expr) return;

      // Replace service references like $window with actual instances
      const replacedExpr = expr.replace(
        /\$(\w+)/g,
        function (match, serviceName) {
          try {
            const service = $injector.get("$" + serviceName);
            // We store the service in a temporary variable name
            const tempVarName = "$" + serviceName;
            scope.$target[tempVarName] = service;
            return tempVarName;
          } catch {
            console.warn(`Service $${serviceName} not found in $injector`);
            return match;
          }
        },
      );

      // Evaluate the expression in scope
      const fn = $parse(replacedExpr);
      scope.$eval(fn);
    },
  };
}
