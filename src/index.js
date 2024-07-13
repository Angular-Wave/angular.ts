import { Angular, angularInit } from "./loader";
import { publishExternalAPI } from "./public";

/**
 * @type {Angular}
 */
window.angular = new Angular();

publishExternalAPI();

document.addEventListener("DOMContentLoaded", () => {
  angularInit(document);
});
