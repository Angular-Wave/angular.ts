ngSetterDirective.$inject = ["$parse"];
/**
 * @returns {import('../../types.js').Directive}
 */
export function ngSetterDirective($parse) {
  return {
    restrict: "A",
    link(scope, element, attrs) {
      const modelExpression = attrs.ngSetter;

      if (!modelExpression) {
        console.warn("ngSetter: Model expression is not provided.");
        return;
      }

      const assignModel = $parse(modelExpression).assign;

      if (!assignModel) {
        console.warn("ngSetter: Invalid model expression.");
        return;
      }

      const updateModel = (value) => {
        if (value !== "") {
          debugger;
          const maybeNumber = convertToNumberOrString(value);
          assignModel(scope, maybeNumber);
          scope.$digest();
        }
      };

      const observer = new MutationObserver((mutationsList) => {
        let contentChanged = false;
        for (const mutation of mutationsList) {
          if (
            mutation.type === "childList" ||
            mutation.type === "characterData"
          ) {
            contentChanged = true;
            break;
          }
        }

        if (contentChanged) {
          updateModel(element[0].innerHTML);
        }
      });

      if (element && element[0]) {
        observer.observe(element[0], {
          childList: true,
          subtree: true,
          characterData: true,
        });
      } else {
        console.warn("ngSetter: Element is not a valid DOM node.");
        return;
      }

      scope.$on("$destroy", () => observer.disconnect());
      const content = element.html();
      debugger;
      updateModel(content);
    },
  };
}

/**
 * Converts the input to a number if possible, otherwise returns the input as a string.
 *
 * @param {string} input - The input to be converted or returned.
 * @returns {number|string} The converted number if valid, or the original string if not convertible.
 */
function convertToNumberOrString(input) {
  const converted = Number(input);
  return isNaN(converted) ? input : converted;
}
