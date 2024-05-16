/**
 * @returns {angular.IDirective}
 */
export function ngInitDirective() {
  return {
    priority: 450,
    compile() {
      return {
        pre(scope, _element, attrs) {
          scope.$eval(attrs.ngInit);
        },
      };
    },
  };
}
