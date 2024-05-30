/** @publicapi @module ng1 */ /** */

/** @hidden */
function $ViewScrollProvider() {
  let useAnchorScroll = false;
  this.useAnchorScroll = function () {
    useAnchorScroll = true;
  };
  this.$get = [
    "$anchorScroll",
    "$timeout",
    function ($anchorScroll, $timeout) {
      if (useAnchorScroll) {
        return $anchorScroll;
      }
      return function ($element) {
        return $timeout(
          function () {
            $element[0].scrollIntoView();
          },
          0,
          false,
        );
      };
    },
  ];
}

window.angular
  .module("ui.router.state")
  .provider("$uiViewScroll", $ViewScrollProvider);
