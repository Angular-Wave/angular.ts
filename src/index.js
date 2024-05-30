import { Angular, angularInit } from "./loader";
import { publishExternalAPI } from "./public";

/**
 * @type {angular.IAngularStatic}
 */
window.angular = new Angular();
console.log(window.angular);

publishExternalAPI();

document.addEventListener("DOMContentLoaded", () => {
  angularInit(document);
});
