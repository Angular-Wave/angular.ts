export class ViewScrollProvider {
  constructor() {
    this.enabled = false;
  }

  useAnchorScroll() {
    this.enabled = true;
  }

  $get = [
    "$anchorScroll",
    "$timeout",
    /**
     * @param {import('../services/anchor-scroll').AnchorScrollObject} $anchorScroll
     * @param {*} $timeout
     * @returns {import('../services/anchor-scroll').AnchorScrollObject|Function}
     */
    ($anchorScroll, $timeout) => {
      if (this.enabled) {
        return $anchorScroll;
      }
      /**
       * @param {import('../shared/jqlite/jqlite').JQLite} $element
       * @returns {import('../core/q/q').QPromise<any>}
       */
      return function ($element) {
        return $timeout(
          () => {
            $element[0].scrollIntoView();
          },
          0,
          false,
        );
      };
    },
  ];
}
