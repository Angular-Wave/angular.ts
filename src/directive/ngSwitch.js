import { forEach } from "../core/utils";
import { ngDirective } from "./directives";
import { getBlockNodes } from "../jqLite";

/**
 * @ngdoc directive
 * @name ngSwitch
 * @restrict EA
 *
 * @description
 * The `ngSwitch` directive is used to conditionally swap DOM structure on your template based on a scope expression.
 * Elements within `ngSwitch` but without `ngSwitchWhen` or `ngSwitchDefault` directives will be preserved at the location
 * as specified in the template.
 *
 * The directive itself works similar to ngInclude, however, instead of downloading template code (or loading it
 * from the template cache), `ngSwitch` simply chooses one of the nested elements and makes it visible based on which element
 * matches the value obtained from the evaluated expression. In other words, you define a container element
 * (where you place the directive), place an expression on the **`on="..."` attribute**
 * (or the **`ng-switch="..."` attribute**), define any inner elements inside of the directive and place
 * a when attribute per element. The when attribute is used to inform ngSwitch which element to display when the on
 * expression is evaluated. If a matching expression is not found via a when attribute then an element with the default
 * attribute is displayed.
 *
 * <div class="alert alert-info">
 * Be aware that the attribute values to match against cannot be expressions. They are interpreted
 * as literal string values to match against.
 * For example, **`ng-switch-when="someVal"`** will match against the string `"someVal"` not against the
 * value of the expression `$scope.someVal`.
 * </div>

 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#enter enter}  | after the ngSwitch contents change and the matched child element is placed inside the container |
 * | {@link ng.$animate#leave leave}  | after the ngSwitch contents change and just before the former contents are removed from the DOM |
 *
 * @usage
 *
 * ```
 * <ANY ng-switch="expression">
 *   <ANY ng-switch-when="matchValue1">...</ANY>
 *   <ANY ng-switch-when="matchValue2">...</ANY>
 *   <ANY ng-switch-default>...</ANY>
 * </ANY>
 * ```
 *
 *
 * @scope
 * @priority 1200
 * @param {*} ngSwitch|on expression to match against <code>ng-switch-when</code>.
 * On child elements add:
 *
 * * `ngSwitchWhen`: the case statement to match against. If match then this
 *   case will be displayed. If the same match appears multiple times, all the
 *   elements will be displayed. It is possible to associate multiple values to
 *   the same `ngSwitchWhen` by defining the optional attribute
 *   `ngSwitchWhenSeparator`. The separator will be used to split the value of
 *   the `ngSwitchWhen` attribute into multiple tokens, and the element will show
 *   if any of the `ngSwitch` evaluates to any of these tokens.
 * * `ngSwitchDefault`: the default case when no other case match. If there
 *   are multiple default cases, all of them will be displayed when no other
 *   case match.
 *
 */
export const ngSwitchDirective = [
  "$animate",
  "$compile",
  ($animate, $compile) => ({
    require: "ngSwitch",

    // asks for $scope to fool the BC controller module
    controller: [
      "$scope",
      function NgSwitchController() {
        this.cases = {};
      },
    ],
    link(scope, element, attr, ngSwitchController) {
      const watchExpr = attr.ngSwitch || attr.on;
      let selectedTranscludes = [];
      const selectedElements = [];
      const previousLeaveAnimations = [];
      const selectedScopes = [];

      const spliceFactory = function (array, index) {
        return function (response) {
          if (response !== false) array.splice(index, 1);
        };
      };

      scope.$watch(watchExpr, (value) => {
        let i;
        let ii;

        // Start with the last, in case the array is modified during the loop
        while (previousLeaveAnimations.length) {
          $animate.cancel(previousLeaveAnimations.pop());
        }

        for (i = 0, ii = selectedScopes.length; i < ii; ++i) {
          const selected = getBlockNodes(selectedElements[i].clone);
          selectedScopes[i].$destroy();
          const runner = (previousLeaveAnimations[i] =
            $animate.leave(selected));
          runner.done(spliceFactory(previousLeaveAnimations, i));
        }

        selectedElements.length = 0;
        selectedScopes.length = 0;

        if (
          (selectedTranscludes =
            ngSwitchController.cases[`!${value}`] ||
            ngSwitchController.cases["?"])
        ) {
          forEach(selectedTranscludes, (selectedTransclude) => {
            selectedTransclude.transclude((caseElement, selectedScope) => {
              selectedScopes.push(selectedScope);
              const anchor = selectedTransclude.element;
              caseElement[caseElement.length++] =
                $compile.$$createComment("end ngSwitchWhen");
              const block = { clone: caseElement };

              selectedElements.push(block);
              $animate.enter(caseElement, anchor.parent(), anchor);
            });
          });
        }
      });
    },
  }),
];

export const ngSwitchWhenDirective = ngDirective({
  transclude: "element",
  priority: 1200,
  require: "^ngSwitch",
  multiElement: true,
  link(scope, element, attrs, ctrl, $transclude) {
    const cases = attrs.ngSwitchWhen
      .split(attrs.ngSwitchWhenSeparator)
      .sort()
      .filter(
        // Filter duplicate cases
        (element, index, array) => array[index - 1] !== element,
      );

    forEach(cases, (whenCase) => {
      ctrl.cases[`!${whenCase}`] = ctrl.cases[`!${whenCase}`] || [];
      ctrl.cases[`!${whenCase}`].push({
        transclude: $transclude,
        element,
      });
    });
  },
});

export const ngSwitchDefaultDirective = ngDirective({
  transclude: "element",
  priority: 1200,
  require: "^ngSwitch",
  multiElement: true,
  link(scope, element, attr, ctrl, $transclude) {
    ctrl.cases["?"] = ctrl.cases["?"] || [];
    ctrl.cases["?"].push({ transclude: $transclude, element });
  },
});
