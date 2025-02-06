import { domInsert } from "../../animations/animate";
import { getBlockNodes, removeElement } from "../../shared/jqlite/jqlite.js";
import { hasAnimate } from "../../shared/utils.js";

ngIfDirective.$inject = ["$animate"];
/**
 *
 * TODO // Add type for animate service
 * @param {*}  $animate
 * @returns {import("../../types").Directive}
 */
export function ngIfDirective($animate) {
  return {
    multiElement: true,
    transclude: "element",
    priority: 600,
    terminal: true,
    restrict: "A",
    /**
     *
     * @param {import("../../core/scope/scope").Scope} $scope
     * @param {Element} $element
     * @param {import("../../core/compile/attributes").Attributes} $attr
     * @param {Object} _ctrl
     * @param {*} $transclude
     */
    link($scope, $element, $attr, _ctrl, $transclude) {
      /** @type {Element} */
      let block;

      /** @type {import('../../core/scope/scope').Scope} */
      let childScope;

      let previousElements;
      let parent = $element.parentElement;

      $scope.$watch($attr["ngIf"], (value) => {
        if (value) {
          if (!childScope) {
            $transclude((clone, newScope) => {
              childScope = newScope;
              // Note: We only need the first/last node of the cloned nodes.
              // However, we need to keep the reference to the jqlite wrapper as it might be changed later
              // by a directive with templateUrl when its template arrives.
              block = clone;
              if (hasAnimate(clone)) {
                $animate.enter(clone, $element.parentElement, $element);
              } else {
                parent.replaceChild(clone[0], $element);
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
              parent.replaceChild($element, previousElements[0]);
            }
            block = null;
          }
        }
      });
    },
  };
}
