import { ngDirective } from "./directives";
import { forEach } from "../utils";

/**
 * @ngdoc directive
 * @name ngStyle
 * @restrict AC
 *
 * @description
 * The `ngStyle` directive allows you to set CSS style on an HTML element conditionally.
 *
 * @knownIssue
 * You should not use {@link guide/interpolation interpolation} in the value of the `style`
 * attribute, when using the `ngStyle` directive on the same element.
 * See {@link guide/interpolation#known-issues here} for more info.
 *
 * @element ANY
 * @param {expression} ngStyle
 *
 * {@link guide/expression Expression} which evals to an
 * object whose keys are CSS style names and values are corresponding values for those CSS
 * keys.
 *
 * Since some CSS style names are not valid keys for an object, they must be quoted.
 * See the 'background-color' style in the example below.
 *
 */
export const ngStyleDirective = ngDirective((scope, element, attr) => {
  scope.$watchCollection(attr.ngStyle, (newStyles, oldStyles) => {
    if (oldStyles && newStyles !== oldStyles) {
      forEach(oldStyles, (val, style) => {
        element.css(style, "");
      });
    }
    if (newStyles) element.css(newStyles);
  });
});
