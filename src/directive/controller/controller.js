export function ngControllerDirective() {
  return {
    restrict: "A",
    scope: true,
    controller: "@",
    priority: 500,
  };
}
