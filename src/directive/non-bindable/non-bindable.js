/**
 *
 * @returns {angular.IDirective}
 */
export function ngNonBindableDirective() {
  return {
    restrict: "EA",
    terminal: true,
    priority: 1000,
  };
}
