angular.module("test", []).run(($sce) => {
  window.isTrustedUrl = function (url) {
    try {
      $sce.getTrustedResourceUrl(url);
    } catch (e) {
      return false;
    }
    return true;
  };
});
