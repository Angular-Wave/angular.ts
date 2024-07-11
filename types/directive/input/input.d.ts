export function weekParser(isoWeek: any, existingDate: any): any;
export function createDateParser(
  regexp: any,
  mapping: any,
): (iso: any, previousDate: any) => any;
export function createDateInputType(
  type: any,
  regexp: any,
  parseDate: any,
): (
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
  $browser: any,
  $filter: any,
  $parse: any,
) => void;
export function badInputChecker(
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
  parserName: any,
): void;
export function numberFormatterParser(ctrl: any): void;
export function isNumberInteger(num: any): boolean;
export function countDecimals(num: any): number;
export function isValidForStep(
  viewValue: any,
  stepBase: any,
  step: any,
): boolean;
export function numberInputType(
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
  $browser: any,
  $filter: any,
  $parse: any,
): void;
export function rangeInputType(
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
  $browser: any,
): void;
export function hiddenInputBrowserCacheDirective(): {
  restrict: string;
  priority: number;
  compile(
    _: any,
    attr: any,
  ): {
    pre(scope: any, element: any): void;
  };
};
/**
 * @ngdoc directive
 * @name ngValue
 * @restrict A
 * @priority 100
 *
 * @description
 * Binds the given expression to the value of the element.
 *
 * It is mainly used on {@link input[radio] `input[radio]`} and option elements,
 * so that when the element is selected, the {@link ngModel `ngModel`} of that element (or its
 * {@link select `select`} parent element) is set to the bound value. It is especially useful
 * for dynamically generated lists using {@link ngRepeat `ngRepeat`}, as shown below.
 *
 * It can also be used to achieve one-way binding of a given expression to an input element
 * such as an `input[text]` or a `textarea`, when that element does not use ngModel.
 *
 * @element ANY
 * @param {string=} ngValue AngularJS expression, whose value will be bound to the `value` attribute
 * and `value` property of the element.
 *
 */
export function ngValueDirective(): {
  restrict: string;
  priority: number;
  compile(tpl: any, tplAttr: any): (scope: any, elm: any, attr: any) => void;
};
export const ISO_DATE_REGEXP: RegExp;
export const URL_REGEXP: RegExp;
export const EMAIL_REGEXP: RegExp;
export const VALIDITY_STATE_PROPERTY: "validity";
/**
 * @ngdoc directive
 * @name textarea
 * @restrict E
 *
 * @description
 * HTML textarea element control with AngularJS data-binding. The data-binding and validation
 * properties of this element are exactly the same as those of the
 * {@link ng.directive:input input element}.
 *
 * @param {string} ngModel Assignable AngularJS expression to data-bind to.
 * @param {string=} name Property name of the form under which the control is published.
 * @param {string=} required Sets `required` validation error key if the value is not entered.
 * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
 *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
 *    `required` when you want to data-bind to the `required` attribute.
 * @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
 *    maxlength. Setting the attribute to a negative or non-numeric value, allows view values of any
 *    length.
 * @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
 *    does not match a RegExp found by evaluating the AngularJS expression given in the attribute value.
 *    If the expression evaluates to a RegExp object, then this is used directly.
 *    If the expression evaluates to a string, then it will be converted to a RegExp
 *    after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
 *    `new RegExp('^abc$')`.<br />
 *    **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
 *    start at the index of the last search's match, thus not taking the whole input value into
 *    account.
 * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
 *    interaction with the input element.
 * @param {boolean=} [ngTrim=true] If set to false AngularJS will not automatically trim the input.
 *
 * @knownIssue
 *
 * When specifying the `placeholder` attribute of `<textarea>`, Internet Explorer will temporarily
 * insert the placeholder value as the textarea's content. If the placeholder value contains
 * interpolation (`{{ ... }}`), an error will be logged in the console when AngularJS tries to update
 * the value of the by-then-removed text node. This doesn't affect the functionality of the
 * textarea, but can be undesirable.
 *
 * You can work around this Internet Explorer issue by using `ng-attr-placeholder` instead of
 * `placeholder` on textareas, whenever you need interpolation in the placeholder value. You can
 * find more details on `ngAttr` in the
 * [Interpolation](guide/interpolation#-ngattr-for-binding-to-arbitrary-attributes) section of the
 * Developer Guide.
 */
/**
 * @ngdoc directive
 * @name input
 * @restrict E
 *
 * @description
 * HTML input element control. When used together with {@link ngModel `ngModel`}, it provides data-binding,
 * input state control, and validation.
 * Input control follows HTML5 input types and polyfills the HTML5 validation behavior for older browsers.
 *
 * <div class="alert alert-warning">
 * **Note:** Not every feature offered is available for all input types.
 * Specifically, data binding and event handling via `ng-model` is unsupported for `input[file]`.
 * </div>
 *
 * @param {string} ngModel Assignable AngularJS expression to data-bind to.
 * @param {string=} name Property name of the form under which the control is published.
 * @param {string=} required Sets `required` validation error key if the value is not entered.
 * @param {boolean=} ngRequired Sets `required` attribute if set to true
 * @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
 *    minlength.
 * @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
 *    maxlength. Setting the attribute to a negative or non-numeric value, allows view values of any
 *    length.
 * @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
 *    value does not match a RegExp found by evaluating the AngularJS expression given in the attribute value.
 *    If the expression evaluates to a RegExp object, then this is used directly.
 *    If the expression evaluates to a string, then it will be converted to a RegExp
 *    after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
 *    `new RegExp('^abc$')`.<br />
 *    **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
 *    start at the index of the last search's match, thus not taking the whole input value into
 *    account.
 * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
 *    interaction with the input element.
 * @param {boolean=} [ngTrim=true] If set to false AngularJS will not automatically trim the input.
 *    This parameter is ignored for input[type=password] controls, which will never trim the
 *    input.
 *
 */
export const inputDirective: (
  | string
  | ((
      $browser: any,
      $filter: any,
      $parse: any,
    ) => {
      restrict: string;
      require: string[];
      link: {
        pre(scope: any, element: any, attr: any, ctrls: any): void;
      };
    })
)[];
