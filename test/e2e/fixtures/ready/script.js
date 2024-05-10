let beforeReady;
(function () {
  const divAfterScripts = window.document.getElementById("div-after-scripts");
  beforeReady = divAfterScripts && divAfterScripts.textContent;
})();

let afterReady;
angular.element(() => {
  const divAfterScripts = window.document.getElementById("div-after-scripts");
  afterReady = divAfterScripts && divAfterScripts.textContent;
});

let afterReadyMethod;
angular.element(window.document).ready(() => {
  const divAfterScripts = window.document.getElementById("div-after-scripts");
  afterReadyMethod = divAfterScripts && divAfterScripts.textContent;
});

const afterReadySync = afterReady;
const afterReadyMethodSync = afterReadyMethod;

angular.module("test", []).run(($rootScope) => {
  $rootScope.beforeReady = beforeReady;
  $rootScope.afterReady = afterReady;
  $rootScope.afterReadySync = afterReadySync;
  $rootScope.afterReadyMethod = afterReadyMethod;
  $rootScope.afterReadyMethodSync = afterReadyMethodSync;
});
