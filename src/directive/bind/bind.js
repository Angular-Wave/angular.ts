import { isUndefined, stringify, isNull, isProxy } from "../../shared/utils.js";

/**
 * @returns {import('../../types.js').Directive}
 */
export function ngBindDirective() {
  return {
    restrict: "EA",
    /**
     * @param {import('../../core/scope/scope.js').Scope} scope
     * @param {Element} element
     * @param {import('../../core/compile/attributes.js').Attributes} attr
     */
    link(scope, element, attr) {
      scope.$watch(attr["ngBind"], (value) => {
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

ngBindHtmlDirective.$inject = ["$parse"];
/**
 * @returns {import('../../types.js').Directive}
 */
export function ngBindHtmlDirective($parse) {
  return {
    restrict: "A",
    compile(_tElement, tAttrs) {
      $parse(tAttrs.ngBindHtml); // checks for interpolation errors
      return (
        /**
         * @param {import('../../core/scope/scope.js').Scope} scope
         * @param {Element} element
         */
        (scope, element) => {
          scope.$watch(tAttrs.ngBindHtml, (val) => {
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
