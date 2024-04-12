import { Angular, allowAutoBootstrap, confGlobal } from "./loader";
import { publishExternalAPI } from "./public";

// Current script not available in submodule
confGlobal.isAutoBootstrapAllowed =
  window.AUTOBOOTSTRAP || allowAutoBootstrap(document.currentScript);
/**
 * @type {angular.IAngularStatic}
 */
window.angular = new Angular();

publishExternalAPI();

document.addEventListener("DOMContentLoaded", () => {
  window.angular
    .module("myModule", [])
    .directive("myTranscluder", function () {
      return {
        transclude: true,
        scope: true,
        link: function (scope, element, attrs, ctrl, transclude) {
          element.append(transclude());
          window.scope = scope;

          scope.$on("destroyNow", function () {
            scope.$destroy();
          });
        },
      };
    })
    .directive("insideTranscluder", function () {
      return {
        link: function (scope) {
          console.log("test");
        },
      };
    });
  window.angular.bootstrap(document, ["myModule"]);
  //angularInit(document, window.angular.bootstrap);
});
