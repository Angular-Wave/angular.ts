import {
  getEventNameForElement,
  handleSwapResponse,
} from "../../shared/dom.js";

ngGetDirective.$inject = ["$http", "$compile", "$log"];

/**
 * @param {{ get: (arg0: any) => Promise<any>; }} $http
 * @param {import("../../core/compile/compile.js").CompileFn} $compile
 * @param {import("../../services/log.js").LogService} $log
 * @returns {import('../../interface.ts').Directive}
 */
export function ngGetDirective($http, $compile, $log) {
  return {
    restrict: "A",
    terminal: true,
    link(scope, element, attrs) {
      const eventName = getEventNameForElement(element);
      const tag = element.tagName.toLowerCase();

      element.addEventListener(eventName, (event) => {
        if (/** @type {HTMLButtonElement} */ (element).disabled) {
          return;
        }
        if (tag === "form") {
          event.preventDefault();
        }
        const swap = element.dataset.swap || "innerHTML";
        const targetSelector = element.dataset.target;
        const target = targetSelector
          ? document.querySelector(targetSelector)
          : element;

        if (!target) {
          $log.warn(`ngGetDirective: target "${targetSelector}" not found`);
          return;
        }

        function handler(res) {
          const html = res.data;
          handleSwapResponse(
            html,
            /** @type {import("../../interface.ts").SwapInsertPosition} */ (
              swap
            ),
            target,
            scope,
            $compile,
          );
        }

        $http
          .get(attrs["ngGet"])
          .then((res) => handler(res))
          .catch((err) => handler(err));
      });
    },
  };
}
