import { valueFn } from "../core/utils";

/**
 * @ngdoc directive
 * @name ngChange
 * @restrict A
 *
 * @description
 * Evaluate the given expression when the user changes the input.
 * The expression is evaluated immediately, unlike the JavaScript onchange event
 * which only triggers at the end of a change (usually, when the user leaves the
 * form element or presses the return key).
 *
 * The `ngChange` expression is only evaluated when a change in the input value causes
 * a new value to be committed to the model.
 *
 * It will not be evaluated:
 * * if the value returned from the `$parsers` transformation pipeline has not changed
 * * if the input has continued to be invalid since the model will stay `null`
 * * if the model is changed programmatically and not by a change to the input value
 *
 *
 * Note, this directive requires `ngModel` to be present.
 *
 * @element ANY
 * @param {expression} ngChange {@link guide/expression Expression} to evaluate upon change
 * in input value.
 *
 */
export const ngChangeDirective = valueFn({
  restrict: "A",
  require: "ngModel",
  link(scope, element, attr, ctrl) {
    ctrl.$viewChangeListeners.push(() => {
      scope.$eval(attr.ngChange);
    });
  },
});
