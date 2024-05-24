/**
 * @ngdoc directive
 * @name a
 * @restrict E
 *
 * @description
 * Modifies the default behavior of the html a tag so that the default action is prevented when
 * the href attribute is empty.
 *
 * For dynamically creating `href` attributes for a tags, see the {@link ng.ngHref `ngHref`} directive.
 */
export function htmlAnchorDirective() {
  return {
    restrict: "E",
    compile: (_element, attr) => {
      if (!attr.href && !attr.xlinkHref) {
        return (_scope, element) => {
          // If the linked element is not an anchor tag anymore, do nothing
          if (element[0].nodeName.toLowerCase() !== "a") return;

          // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
          const href =
            toString.call(element[0].href) === "[object SVGAnimatedString]"
              ? "xlink:href"
              : "href";
          element.on("click", (event) => {
            // if we have no href url, then don't navigate anywhere.
            if (!element.attr(href)) {
              event.preventDefault();
            }
          });
        };
      }
      return () => {};
    },
  };
}
