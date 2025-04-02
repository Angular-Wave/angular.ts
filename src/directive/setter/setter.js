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
        assignModel(scope, value);
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
          updateModel(element.innerHTML);
        }
      });

      if (element && element) {
        observer.observe(element, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      } else {
        console.warn("ngSetter: Element is not a valid DOM node.");
        return;
      }

      scope.$on("$destroy", () => observer.disconnect());
      updateModel(element.innerHTML);
    },
  };
}
