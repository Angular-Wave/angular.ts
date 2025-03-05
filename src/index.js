import { Angular } from "./loader";

export const angular = new Angular();
document.addEventListener("DOMContentLoaded", () => angular.init(document), {
  once: true,
});

