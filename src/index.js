import { Angular, angularInit } from "./loader";
import { publishExternalAPI } from "./public";

/**
 * @type {Angular}
 */
const angular = new Angular();
window["angular"] = angular;

publishExternalAPI();

document.addEventListener("DOMContentLoaded", () => {
  angularInit(document);
});
