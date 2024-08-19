export const scriptDirective = [
  "$templateCache",
  ($templateCache) => ({
    restrict: "E",
    terminal: true,
    compile(element, attr) {
      if (attr.type === "text/ng-template") {
        const templateUrl = attr.id;
        const { text } = element[0];

        $templateCache.put(templateUrl, text);
      }
    },
  }),
];
