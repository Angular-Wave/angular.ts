export interface NGViewScrollProvider {
  /**
   * Uses standard anchorScroll behavior
   *
   * Reverts [[$ngViewScroll]] back to using the core [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
   * service for scrolling based on the url anchor.
   */
  useAnchorScroll(): void;
}
