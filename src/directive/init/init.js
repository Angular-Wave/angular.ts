/**
 * @returns {import('../../types').Directive}
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
