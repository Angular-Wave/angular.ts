// File for DOCsy to update doc version
window.VERSION = "[VI]{version}[/VI]";
const script = document.createElement("script");
script.src =
  "https://cdn.jsdelivr.net/npm/@angular-wave/angular.ts@" +
  window.VERSION +
  "/dist/angular-ts.umd.js";
script.type = "text/javascript";
document.head.appendChild(script);
script.onload = function () {
  window.dispatchEvent(new CustomEvent("AngularLoaded"));
};
