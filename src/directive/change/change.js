/**
 * @returns {angular.IDirective}
 */
export function ngChangeDirective() {
  return {
    restrict: "A",
    require: "ngModel",
    link(scope, _element, attr, ctrl) {
      ctrl.$viewChangeListeners.push(() => scope.$eval(attr.ngChange));
    },
  };
}
