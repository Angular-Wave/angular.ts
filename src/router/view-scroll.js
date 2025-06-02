export class ViewScrollProvider {
  constructor() {
    this.enabled = false;
  }

  useAnchorScroll() {
    this.enabled = true;
  }

  $get = [
    "$anchorScroll",
    /**
     * @param {import('../services/anchor-scroll.js').AnchorScrollObject} $anchorScroll
     * @returns {import('../services/anchor-scroll.js').AnchorScrollObject|Function}
     */
    ($anchorScroll) => {
      if (this.enabled) {
        return $anchorScroll;
      }
      /**
       * @param {Element} $element
       * @returns {Promise<number>}
       */
      return async function ($element) {
        return setTimeout(() => {
          $element.scrollIntoView(false);
        }, 0);
      };
    },
  ];
}
