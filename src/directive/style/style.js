/**
 * @returns {import('../../interface.ts').Directive}
 */
export function ngStyleDirective() {
  return {
    restrict: "A",
    link(scope, element, attr) {
      let oldStyles;
      scope.$watch(attr["ngStyle"], (newStyles) => {
        if (oldStyles) {
          const oldKeys = Object.keys(oldStyles);
          for (let i = 0, length = oldKeys.length; i < length; i++) {
            element.style.removeProperty(oldKeys[i]);
          }
        }
        if (newStyles) {
          oldStyles = { ...newStyles.$target };
          const newEntries = Object.entries(newStyles);
          for (let i = 0, length = newEntries.length; i < length; i++) {
            const [key, value] = newEntries[i];
            element.style.setProperty(key, value);
          }
        }
      });
    },
  };
}
