/**
 * @returns {angular.IDirective}
 */
export function ngCloakDirective() {
  return {
    restrict: "AC",
    compile(element, attr) {
      attr.$set("ngCloak", undefined);
      element[0].classList.remove("ng-cloak");
    },
  };
}
