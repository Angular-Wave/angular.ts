import { isProxy } from "../../core/scope/scope.js";
import { isUndefined, stringify } from "../../shared/utils.js";

/**
 * @returns {import('../../types.js').Directive}
 */
export function ngBindDirective() {
  return {
    restrict: "EA",
    link(scope, element, attr) {
      scope.$watch(attr.ngBind, (value) => {
        element.textContent = stringify(isProxy(value) ? value.$target : value);
      });
    },
  };
}

/**
 * @returns {import('../../types.js').Directive}
 */
export function ngBindTemplateDirective() {
  return {
    restrict: "EA",
    link(_scope, element, attr) {
      attr.$observe("ngBindTemplate", (value) => {
        element.textContent = isUndefined(value) ? "" : value;
      });
    },
  };
}

ngBindHtmlDirective.$inject = ["$parse"];
/**
 * @returns {import('../../types.js').Directive}
 */
export function ngBindHtmlDirective($parse) {
  return {
    restrict: "A",
    compile(_tElement, tAttrs) {
      $parse(tAttrs.ngBindHtml); // checks for interpolation errors
      return (scope, element) => {
        scope.$watch(tAttrs.ngBindHtml, (val) => {
          element.innerHTML = val;
        });
      };
    },
  };
}
