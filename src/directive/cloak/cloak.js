/**
 * @returns {ng.Directive}
 */
export function ngCloakDirective() {
  return {
    compile(element, attr) {
      attr.$set("ngCloak", undefined);
      element.classList.remove("ng-cloak");
    },
  };
}
