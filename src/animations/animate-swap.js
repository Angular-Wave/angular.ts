ngAnimateSwapDirective.$inject = ["$animate"];
/**
 * @returns {import('../interface.ts').Directive}
 */
export function ngAnimateSwapDirective($animate) {
  return {
    restrict: "A",
    transclude: "element",
    terminal: true,
    priority: 550, // We use 550 here to ensure that the directive is caught before others,
    // but after `ngIf` (at priority 600).
    link(scope, $element, attrs, ctrl, $transclude) {
      let previousElement;
      let previousScope;
      scope.$watchCollection(
        attrs["ngAnimateSwap"] || attrs["for"],
        (value) => {
          if (previousElement) {
            $animate.leave(previousElement);
          }
          if (previousScope) {
            previousScope.$destroy();
            previousScope = null;
          }
          if (value) {
            $transclude((clone, childScope) => {
              previousElement = clone;
              previousScope = childScope;
              $animate.enter(clone, null, $element);
            });
          }
        },
      );
    },
  };
}
