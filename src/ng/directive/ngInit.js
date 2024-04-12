import { ngDirective } from "./directives";

/**
 * @ngdoc directive
 * @name ngInit
 * @restrict AC
 * @priority 450
 * @element ANY
 *
 * @param {expression} ngInit {@link guide/expression Expression} to eval.
 *
 * @description
 * The `ngInit` directive allows you to evaluate an expression in the
 * current scope.
 *
 * <div class="alert alert-danger">
 * This directive can be abused to add unnecessary amounts of logic into your templates.
 * There are only a few appropriate uses of `ngInit`:
 * <ul>
 *   <li>aliasing special properties of {@link ng.directive:ngRepeat `ngRepeat`},
 *     as seen in the demo below.</li>
 *   <li>initializing data during development, or for examples, as seen throughout these docs.</li>
 *   <li>injecting data via server side scripting.</li>
 * </ul>
 *
 * Besides these few cases, you should use {@link guide/component Components} or
 * {@link guide/controller Controllers} rather than `ngInit` to initialize values on a scope.
 * </div>
 *
 * <div class="alert alert-warning">
 * **Note**: If you have assignment in `ngInit` along with a {@link ng.$filter `filter`}, make
 * sure you have parentheses to ensure correct operator precedence:
 * <pre class="prettyprint">
 * `<div ng-init="test1 = ($index | toString)"></div>`
 * </pre>
 * </div>
 *
 */
export const ngInitDirective = ngDirective({
  priority: 450,
  compile() {
    return {
      pre(scope, _element, attrs) {
        scope.$eval(attrs.ngInit);
      },
    };
  },
});
