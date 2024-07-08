import { forEach } from "../shared/utils";
import { getBlockNodes } from "../jqLite";

export const ngSwitchDirective = [
  "$animate",
  ($animate) => ({
    require: "ngSwitch",

    // asks for $scope to fool the BC controller module
    controller: [
      "$scope",
      class {
        constructor() {
          this.cases = {};
        }
      },
    ],
    link(scope, _element, attr, ngSwitchController) {
      const watchExpr = attr.ngSwitch || attr.on;
      let selectedTranscludes = [];
      const selectedElements = [];
      const previousLeaveAnimations = [];
      const selectedScopes = [];

      const spliceFactory = function (array, index) {
        return function (response) {
          if (response !== false) array.splice(index, 1);
        };
      };

      scope.$watch(watchExpr, (value) => {
        let i;
        let ii;

        // Start with the last, in case the array is modified during the loop
        while (previousLeaveAnimations.length) {
          $animate.cancel(previousLeaveAnimations.pop());
        }

        for (i = 0, ii = selectedScopes.length; i < ii; ++i) {
          const selected = getBlockNodes(selectedElements[i].clone);
          selectedScopes[i].$destroy();
          const runner = (previousLeaveAnimations[i] =
            $animate.leave(selected));
          runner.done(spliceFactory(previousLeaveAnimations, i));
        }

        selectedElements.length = 0;
        selectedScopes.length = 0;

        if (
          (selectedTranscludes =
            ngSwitchController.cases[`!${value}`] ||
            ngSwitchController.cases["?"])
        ) {
          forEach(selectedTranscludes, (selectedTransclude) => {
            selectedTransclude.transclude((caseElement, selectedScope) => {
              selectedScopes.push(selectedScope);
              const anchor = selectedTransclude.element;
              const block = { clone: caseElement };
              selectedElements.push(block);
              $animate.enter(caseElement, anchor.parent(), anchor);
            });
          });
        }
      });
    },
  }),
];

/**
 * @returns {angular.IDirective}
 */
export function ngSwitchWhenDirective() {
  return {
    transclude: "element",
    priority: 1200,
    restrict: "EA",
    require: "^ngSwitch",
    multiElement: true,
    link(scope, element, attrs, ctrl, $transclude) {
      const cases = attrs.ngSwitchWhen
        .split(attrs.ngSwitchWhenSeparator)
        .sort()
        .filter(
          // Filter duplicate cases
          (element, index, array) => array[index - 1] !== element,
        );

      cases.forEach((whenCase) => {
        ctrl.cases[`!${whenCase}`] = ctrl.cases[`!${whenCase}`] || [];
        ctrl.cases[`!${whenCase}`].push({
          transclude: $transclude,
          element,
        });
      });
    },
  };
}

/**
 * @returns {angular.IDirective}
 */
export function ngSwitchDefaultDirective() {
  return {
    restrict: "EA",
    transclude: "element",
    priority: 1200,
    require: "^ngSwitch",
    multiElement: true,
    link(_scope, element, _attr, ctrl, $transclude) {
      ctrl.cases["?"] = ctrl.cases["?"] || [];
      ctrl.cases["?"].push({ transclude: $transclude, element });
    },
  };
}
