import { isUndefined } from "../../shared/utils.js";

/**
 * @param {string} source - the name of the attribute to be observed
 * @param {string} prop - the scope property to be updated with attribute value
 * @returns {import("../../types.js").Directive}
 */
export function ngObserveDirective(source, prop) {
  return {
    restrict: "A",
    compile: () => (scope, element) => {
      const targetElement = element[0];
      if (isUndefined(prop) || prop == "") {
        prop = source;
      }
      if (!scope[prop]) {
        scope[prop] = targetElement.getAttribute(source);
      }

      const observer = new MutationObserver((mutations) => {
        const mutation = mutations[0];
        const newValue = /** @type {HTMLElement} */ (
          mutation.target
        ).getAttribute(source);
        if (scope[prop] !== newValue) {
          scope[prop] = newValue;
          scope.$digest();
        }
      });

      observer.observe(targetElement, {
        attributes: true,
        attributeFilter: [source],
      });

      scope.$on("$destroy", () => {
        observer.disconnect();
      });
    },
  };
}
