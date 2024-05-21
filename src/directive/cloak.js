/**
 * @returns {angular.IDirective}
 */
export function ngCloakDirective() {
  return {
    restrict: "EA",
    compile(element, attr) {
      attr.$set("ngCloak", undefined);
      element[0].classList.remove("ng-cloak");
    },
  };
}
