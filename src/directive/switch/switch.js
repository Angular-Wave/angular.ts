import { domInsert, getBlockNodes } from "../../shared/dom.js";
import { hasAnimate } from "../../shared/utils.js";

ngSwitchDirective.$inject = ["$animate"];

/**
 * @returns {import('../../types.js').Directive}
 */
export function ngSwitchDirective($animate) {
  return {
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

          if (hasAnimate(selected)) {
            const runner = (previousLeaveAnimations[i] =
              $animate.leave(selected));
            runner.done(spliceFactory(previousLeaveAnimations, i));
          } else {
            selected.remove();
          }
        }

        selectedElements.length = 0;
        selectedScopes.length = 0;

        if (
          (selectedTranscludes =
            ngSwitchController["cases"][`!${value}`] ||
            ngSwitchController["cases"]["?"])
        ) {
          Object.values(selectedTranscludes).forEach((selectedTransclude) => {
            selectedTransclude.transclude((caseElement, selectedScope) => {
              selectedScopes.push(selectedScope);
              const anchor = selectedTransclude.element;
              // TODO removing this breaks repeater test
              const block = {
                clone: caseElement,
                comment: document.createComment(""),
              };
              selectedElements.push(block);
              if (hasAnimate(caseElement)) {
                $animate.enter(caseElement, anchor.parentElement, anchor);
              } else {
                domInsert(caseElement, anchor.parentElement, anchor);
              }
            });
          });
        }
      });
    },
  };
}

/**
 * @returns {import('../../types.js').Directive}
 */
export function ngSwitchWhenDirective() {
  return {
    transclude: "element",
    terminal: true,
    priority: 1200,
    restrict: "EA",
    require: "^ngSwitch",
    link(scope, element, attrs, ctrl, $transclude) {
      const cases = attrs.ngSwitchWhen
        .split(attrs.ngSwitchWhenSeparator)
        .sort()
        .filter(
          // Filter duplicate cases
          (element, index, array) => array[index - 1] !== element,
        );

      cases.forEach((whenCase) => {
        ctrl["cases"][`!${whenCase}`] = ctrl["cases"][`!${whenCase}`] || [];
        ctrl["cases"][`!${whenCase}`].push({
          transclude: $transclude,
          element,
        });
      });
    },
  };
}

/**
 * @returns {import('../../types.js').Directive}
 */
export function ngSwitchDefaultDirective() {
  return {
    restrict: "EA",
    transclude: "element",
    terminal: true,
    priority: 1200,
    require: "^ngSwitch",
    link(_scope, element, _attr, ctrl, $transclude) {
      ctrl["cases"]["?"] = ctrl["cases"]["?"] || [];
      ctrl["cases"]["?"].push({ transclude: $transclude, element });
    },
  };
}
