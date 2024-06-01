import { Angular, angularInit } from "./loader";
import { publishExternalAPI } from "./public";

/**
 * @type {angular.IAngularStatic}
 */
window.angular = new Angular();

publishExternalAPI();

document.addEventListener("DOMContentLoaded", () => {
  angularInit(document);
});
