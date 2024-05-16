/**
 *
 * @returns {angular.IDirective}
 */
export function ngNonBindableDirective() {
  return {
    restrict: "AC",
    terminal: true,
    priority: 1000,
  };
}
