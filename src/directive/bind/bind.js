import {
  isUndefined,
  stringify,
  isNull,
  isProxy,
  isDefined,
} from "../../shared/utils.js";
import { $injectTokens } from "../../injection-tokens.js";

/**
 * @returns {import('../../interface.ts').Directive}
 */
export function ngBindDirective() {
  return {
    /**
     * @param {import('../../core/scope/scope.js').Scope} scope
     * @param {Element} element
     * @param {import('../../core/compile/attributes.js').Attributes} attr
     */
    link(scope, element, attr) {
      scope.$watch(
        attr["ngBind"],
        (value) => {
          element.textContent = stringify(
            isProxy(value) ? value.$target : value,
          );
        },
        isDefined(attr["lazy"]),
      );
    },
  };
}

/**
 * @returns {import('../../interface.ts').Directive}
 */
export function ngBindTemplateDirective() {
  return {
    /**
     * @param {import('../../core/scope/scope.js').Scope} _scope
     * @param {Element} element
     * @param {import('../../core/compile/attributes.js').Attributes} attr
     */
    link(_scope, element, attr) {
      attr.$observe("ngBindTemplate", (value) => {
        element.textContent = isUndefined(value) ? "" : value;
      });
    },
  };
}

ngBindHtmlDirective.$inject = [$injectTokens.$parse];
/**
 * @param {import('../../core/parse/interface.ts').ParseService} $parse
 * @returns {import('../../interface.ts').Directive}
 */
export function ngBindHtmlDirective($parse) {
  return {
    restrict: "A",
    compile(_tElement, tAttrs) {
      $parse(tAttrs["ngBindHtml"]); // checks for interpolation errors
      return (
        /**
         * @param {import('../../core/scope/scope.js').Scope} scope
         * @param {Element} element
         */
        (scope, element) => {
          scope.$watch(tAttrs["ngBindHtml"], (val) => {
            if (isUndefined(val) || isNull(val)) {
              val = "";
            }
            element.innerHTML = val;
          });
        }
      );
    },
  };
}
