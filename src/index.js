import { Angular } from "./loader";
import { publishExternalAPI } from "./public";

export const angular = new Angular();
window["angular"] = angular;

publishExternalAPI();

document.addEventListener("DOMContentLoaded", () => {
  angular.init(document);
});
