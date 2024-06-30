export const ngControllerDirective = [
  () => ({
    restrict: "A",
    scope: true,
    controller: "@",
    priority: 500,
  }),
];
