import { hasAnimate } from "../../shared/utils.js";

/**
 * @typedef {Object} SwitchCase
 * @property {Element} element
 * @property {Function} transclude - of type "controllersBoundTransclude"
 * @property {Element} comment - the comment replacing the element
 */

/**
 * @typedef {Object} SwitchCaseScope
 * @property {import("../../core/scope/scope.js").Scope} scope
 * @property {Element} element
 * @property {Element} comment
 * @property {SwitchCase} selectedTransclude
 */

/**
 * @extends import("../../types.js").Controller
 */
class SwitchController {
  constructor() {
    /**
     * @type {Record<string, Array<SwitchCase>>}
     */
    this.cases = {};
  }
}

export const ngSwitchDirective = [
  "$animate",
  ($animate) => ({
    require: "ngSwitch",

    controller: ["$scope", SwitchController],

    /**
     * @param {*} scope
     * @param {*} element
     * @param {*} attr
     * @param {SwitchController} ngSwitchController
     */
    link(scope, element, attr, ngSwitchController) {
      const shouldAnimate = hasAnimate(element);
      const watchExpr = attr.ngSwitch || attr.on;
      let selectedTranscludes = [];

      /**
       * @type {SwitchCaseScope[]}
       */
      const selected = [];

      const cleanupSelected = () => {
        while (selected.length > 0) {
          const select = selected.shift();
          select.element.parentElement.replaceChild(
            select.comment,
            select.element,
          );
          select.selectedTransclude.element = select.comment;
        }
      };

      const processTranscludes = (transcludes) => {
        transcludes.forEach((selectedTransclude) => {
          selectedTransclude.transclude(scope, (caseElement, selectedScope) => {
            const anchor = selectedTransclude.element;

            if (shouldAnimate) {
              $animate.enter(caseElement, anchor.parentElement, anchor);
            } else {
              anchor.parentElement.replaceChild(caseElement[0], anchor);
              selectedTransclude.element = caseElement[0];
              selected.push({
                scope: selectedScope,
                element: caseElement[0],
                comment: anchor,
                selectedTransclude: selectedTransclude,
              });
            }
          });
        });
      };

      scope.$watch(watchExpr, (value) => {
        cleanupSelected();
        selectedTranscludes =
          ngSwitchController.cases[`!${value}`] ||
          ngSwitchController.cases["?"];
        if (selectedTranscludes) {
          processTranscludes(Object.values(selectedTranscludes));
        }
      });
    },
  }),
];

export function ngSwitchWhenDirective() {
  return {
    transclude: "element",
    priority: 1200,
    restrict: "EA",
    require: "^ngSwitch",
    link(_scope, element, attrs, ctrl, $transclude) {
      attrs.ngSwitchWhen
        .split(attrs.ngSwitchWhenSeparator)
        .sort()
        .filter((item, index, array) => array[index - 1] !== item)
        .forEach((whenCase) => {
          ctrl.cases[`!${whenCase}`] = ctrl.cases[`!${whenCase}`] || [];
          ctrl.cases[`!${whenCase}`].push({ transclude: $transclude, element });
        });
    },
  };
}

export function ngSwitchDefaultDirective() {
  return {
    restrict: "EA",
    transclude: "element",
    priority: 1200,
    require: "^ngSwitch",
    link(_scope, element, _attr, ctrl, $transclude) {
      ctrl.cases["?"] = ctrl.cases["?"] || [];
      ctrl.cases["?"].push({ transclude: $transclude, element });
    },
  };
}
