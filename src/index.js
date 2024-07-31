import { Angular } from "./loader";

export const angular = new Angular();
window["angular"] = angular;

document.addEventListener("DOMContentLoaded", () => {
  angular.init(document);
});
