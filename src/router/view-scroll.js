export function $ViewScrollProvider() {
  let useAnchorScroll = false;
  this.useAnchorScroll = function () {
    useAnchorScroll = true;
  };
  this.$get = [
    "$anchorScroll",
    "$timeout",
    /**
     * @param {import('../services/anchor-scroll').AnchorScrollObject} $anchorScroll
     * @param {*} $timeout
     * @returns {import('../services/anchor-scroll').AnchorScrollObject|Function}
     */
    ($anchorScroll, $timeout) => {
      if (useAnchorScroll) {
        return $anchorScroll;
      }
      /**
       * @param {import('../shared/jqlite/jqlite').JQLite} $element
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
