/**
 * @returns {import('../../interface.ts').Directive}
 */
export function ngNonBindableDirective() {
  return {
    restrict: "EA",
    terminal: true,
    priority: 1000,
  };
}
