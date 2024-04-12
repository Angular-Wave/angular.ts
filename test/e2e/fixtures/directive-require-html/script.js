angular
  .module("test", [])
  .provider(
    "$exceptionHandler",
    /** @this */ function () {
      this.$get = [
        function () {
          return function (error) {
            window.document.querySelector("#container").textContent =
              error && error.message;
          };
        },
      ];
    },
  )
  .directive("requireDirective", () => ({
    require: "^^requireTargetDirective",
    link(scope, element, attrs, ctrl) {
      window.document.querySelector("#container").textContent = ctrl.content;
    },
  }))
  .directive("requireTargetDirective", () => ({
    controller() {
      this.content = "requiredContent";
    },
  }));
