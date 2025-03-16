import { removeElement } from "../../shared/dom.js";
import { hasAnimate } from "../../shared/utils.js";

ngIfDirective.$inject = ["$animate"];
/**
 *
 * TODO // Add type for animate service
 * @param {*}  $animate
 * @returns {import("../../types.js").Directive}
 */
export function ngIfDirective($animate) {
  return {
    transclude: "element",
    priority: 600,
    terminal: true,
    restrict: "A",
    /**
     *
     * @param {import("../../core/scope/scope.js").Scope} $scope
     * @param {Element} $element
     * @param {import("../../core/compile/attributes.js").Attributes} $attr
     * @param {Object} _ctrl
     * @param {*} $transclude
     */
    link($scope, $element, $attr, _ctrl, $transclude) {
      /** @type {Element} */
      let block;

      /** @type {import('../../core/scope/scope.js').Scope} */
      let childScope;

      let previousElements;

      $scope.$watch($attr["ngIf"], (value) => {
        if (value) {
          if (!childScope) {
            $transclude((clone, newScope) => {
              childScope = newScope;
              // Note: We only need the first/last node of the cloned nodes.
              // However, we need to keep the reference to the dom wrapper as it might be changed later
              // by a directive with templateUrl when its template arrives.
              block = clone;
              if (hasAnimate(clone)) {
                $animate.enter(clone, $element.parentElement, $element);
              } else {
                $element.after(clone);
              }
            });
          }
        } else {
          if (previousElements) {
            removeElement(previousElements);
            previousElements = null;
          }
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
          if (block) {
            previousElements = block;
            if (hasAnimate(previousElements)) {
              $animate.leave(previousElements).done((response) => {
                if (response !== false) previousElements = null;
              });
            } else {
              $element.nextElementSibling.remove();
            }
            block = null;
          }
        }
      });
    },
  };
}
