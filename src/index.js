import { Angular, allowAutoBootstrap, confGlobal, angularInit } from "./loader";
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
  angularInit(document, window.angular.bootstrap);
});
