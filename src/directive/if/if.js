import { getBlockNodes } from "../../shared/jqlite/jqlite";

export const ngIfDirective = [
  "$animate",
  ($animate) => ({
    multiElement: true,
    transclude: "element",
    priority: 600,
    terminal: true,
    restrict: "A",
    link($scope, $element, $attr, ctrl, $transclude) {
      let block;
      let childScope;
      let previousElements;
      $scope.$watch($attr.ngIf, (value) => {
        if (value) {
          if (!childScope) {
            $transclude((clone, newScope) => {
              childScope = newScope;
              // TODO removing this breaks messages test
              clone[clone.length++] = document.createComment("");
              // Note: We only need the first/last node of the cloned nodes.
              // However, we need to keep the reference to the jqlite wrapper as it might be changed later
              // by a directive with templateUrl when its template arrives.
              block = {
                clone,
              };
              $animate.enter(clone, $element.parent(), $element);
            });
          }
        } else {
          if (previousElements) {
            previousElements.remove();
            previousElements = null;
          }
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
          if (block) {
            previousElements = getBlockNodes(block.clone);
            $animate.leave(previousElements).done((response) => {
              if (response !== false) previousElements = null;
            });
            block = null;
          }
        }
      });
    },
  }),
];
