/**
 * @returns {angular.IDirective}
 */
export function ngStyleDirective() {
  return {
    restrict: "AC",
    link: (scope, element, attr) => {
      scope.$watchCollection(attr.ngStyle, (newStyles, oldStyles) => {
        if (oldStyles) {
          Object.keys(oldStyles).forEach((key) => {
            element[0].style[key] = "";
          });
        }
        if (newStyles) {
          Object.entries(newStyles).forEach(([key, value]) => {
            element[0].style[key] = value;
          });
        }
      });
    },
  };
}
