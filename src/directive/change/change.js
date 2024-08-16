/**
 * @returns {import('../../types').Directive}
 */
export function ngChangeDirective() {
  return {
    restrict: "A",
    require: "ngModel",
    link(scope, _element, attr, ctrl) {
      /** @type {import('../../types').NgModelController} */ (
        ctrl
      ).$viewChangeListeners.push(() => scope.$eval(attr.ngChange));
    },
  };
}
