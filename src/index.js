import { Angular } from "./loader.js";

const angular = new Angular();
document.addEventListener("DOMContentLoaded", () => angular.init(document), {
  once: true,
});
