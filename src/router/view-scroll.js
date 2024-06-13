export function $ViewScrollProvider() {
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
      /**
       * @param {JQLite} $element
       */
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
