import {
  isDefined,
  isUndefined,
  isString,
  lowercase,
  trim,
  isObject,
  isNumber,
  isNumberNaN,
  isDate,
  forEach,
  convertTimezoneToLocal,
  addDateMinutes,
  timezoneToOffset,
  nextUid,
  equals,
} from "../../shared/utils";
import { ngModelMinErr } from "./../model/model";

// Regex code was initially obtained from SO prior to modification: https://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime#answer-3143231
export const ISO_DATE_REGEXP =
  /^\d{4,}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+(?:[+-][0-2]\d:[0-5]\d|Z)$/;
// See valid URLs in RFC3987 (http://tools.ietf.org/html/rfc3987)
// Note: We are being more lenient, because browsers are too.
//   1. Scheme
//   2. Slashes
//   3. Username
//   4. Password
//   5. Hostname
//   6. Port
//   7. Path
//   8. Query
//   9. Fragment
//                 1111111111111111 222   333333    44444        55555555555555555555555     666     77777777     8888888     999
export const URL_REGEXP =
  /^[a-z][a-z\d.+-]*:\/*(?:[^:@]+(?::[^@]+)?@)?(?:[^\s:/?#]+|\[[a-f\d:]+])(?::\d+)?(?:\/[^?#]*)?(?:\?[^#]*)?(?:#.*)?$/i;

export const EMAIL_REGEXP =
  /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
const NUMBER_REGEXP = /^\s*(-|\+)?(\d+|(\d*(\.\d*)))([eE][+-]?\d+)?\s*$/;
const DATE_REGEXP = /^(\d{4,})-(\d{2})-(\d{2})$/;
const DATETIMELOCAL_REGEXP =
  /^(\d{4,})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/;
const WEEK_REGEXP = /^(\d{4,})-W(\d\d)$/;
const MONTH_REGEXP = /^(\d{4,})-(\d\d)$/;
const TIME_REGEXP = /^(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/;
// The name of a form control's ValidityState property.
// This is used so that it's possible for internal tests to create mock ValidityStates.
export const VALIDITY_STATE_PROPERTY = "validity";

const PARTIAL_VALIDATION_EVENTS = "keydown wheel mousedown";
/**
 * @type {Map<string, boolean>}
 */
const PARTIAL_VALIDATION_TYPES = new Map();
"date,datetime-local,month,time,week".split(",").forEach((type) => {
  PARTIAL_VALIDATION_TYPES.set(type, true);
});

const inputType = {
  /**
   * @ngdoc input
   * @name input[text]
   *
   * @description
   * Standard HTML text input with AngularJS data binding, inherited by most of the `input` elements.
   *
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} required Adds `required` validation error key if the value is not entered.
   * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
   *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
   *    `required` when you want to data-bind to the `required` attribute.
   * @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
   *    minlength.
   * @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
   *    maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
   *    any length.
   * @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
   *    that contains the regular expression body that will be converted to a regular expression
   *    as in the ngPattern directive.
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
   *    This parameter is ignored for input[type=password] controls, which will never trim the
   *    input.
   */
  text: textInputType,

  /**
   * @ngdoc input
   * @name input[date]
   *
   * @description
   * Input with date validation and transformation. In browsers that do not yet support
   * the HTML5 date input, a text element will be used. In that case, text must be entered in a valid ISO-8601
   * date format (yyyy-MM-dd), for example: `2009-01-06`. Since many
   * modern browsers do not yet support this input type, it is important to provide cues to users on the
   * expected input format via a placeholder or label.
   *
   * The model must always be a Date object, otherwise AngularJS will throw an error.
   * Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
   *
   * The timezone to be used to read/write the `Date` instance in the model can be defined using
   * {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} min Sets the `min` validation error key if the value entered is less than `min`. This must be a
   *   valid ISO date string (yyyy-MM-dd). You can also use interpolation inside this attribute
   *   (e.g. `min="{{minDate | date:'yyyy-MM-dd'}}"`). Note that `min` will also add native HTML5
   *   constraint validation.
   * @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`. This must be
   *   a valid ISO date string (yyyy-MM-dd). You can also use interpolation inside this attribute
   *   (e.g. `max="{{maxDate | date:'yyyy-MM-dd'}}"`). Note that `max` will also add native HTML5
   *   constraint validation.
   * @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO date string
   *   the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
   * @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO date string
   *   the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
   * @param {string=} required Sets `required` validation error key if the value is not entered.
   * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
   *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
   *    `required` when you want to data-bind to the `required` attribute.
   * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
   *    interaction with the input element.
   *
   */
  date: createDateInputType(
    "date",
    DATE_REGEXP,
    createDateParser(DATE_REGEXP, ["yyyy", "MM", "dd"]),
    "yyyy-MM-dd",
  ),

  /**
   * @ngdoc input
   * @name input[datetime-local]
   *
   * @description
   * Input with datetime validation and transformation. In browsers that do not yet support
   * the HTML5 date input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
   * local datetime format (yyyy-MM-ddTHH:mm:ss), for example: `2010-12-28T14:57:00`.
   *
   * The model must always be a Date object, otherwise AngularJS will throw an error.
   * Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
   *
   * The timezone to be used to read/write the `Date` instance in the model can be defined using
   * {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
   *
   * The format of the displayed time can be adjusted with the
   * {@link ng.directive:ngModelOptions#ngModelOptions-arguments ngModelOptions} `timeSecondsFormat`
   * and `timeStripZeroSeconds`.
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
   *   This must be a valid ISO datetime format (yyyy-MM-ddTHH:mm:ss). You can also use interpolation
   *   inside this attribute (e.g. `min="{{minDatetimeLocal | date:'yyyy-MM-ddTHH:mm:ss'}}"`).
   *   Note that `min` will also add native HTML5 constraint validation.
   * @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
   *   This must be a valid ISO datetime format (yyyy-MM-ddTHH:mm:ss). You can also use interpolation
   *   inside this attribute (e.g. `max="{{maxDatetimeLocal | date:'yyyy-MM-ddTHH:mm:ss'}}"`).
   *   Note that `max` will also add native HTML5 constraint validation.
   * @param {(date|string)=} ngMin Sets the `min` validation error key to the Date / ISO datetime string
   *   the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
   * @param {(date|string)=} ngMax Sets the `max` validation error key to the Date / ISO datetime string
   *   the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
   * @param {string=} required Sets `required` validation error key if the value is not entered.
   * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
   *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
   *    `required` when you want to data-bind to the `required` attribute.
   * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
   *    interaction with the input element.
   *
   */
  "datetime-local": createDateInputType(
    "datetimelocal",
    DATETIMELOCAL_REGEXP,
    createDateParser(DATETIMELOCAL_REGEXP, [
      "yyyy",
      "MM",
      "dd",
      "HH",
      "mm",
      "ss",
      "sss",
    ]),
    "yyyy-MM-ddTHH:mm:ss.sss",
  ),

  /**
   * @ngdoc input
   * @name input[time]
   *
   * @description
   * Input with time validation and transformation. In browsers that do not yet support
   * the HTML5 time input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
   * local time format (HH:mm:ss), for example: `14:57:00`. Model must be a Date object. This binding will always output a
   * Date object to the model of January 1, 1970, or local date `new Date(1970, 0, 1, HH, mm, ss)`.
   *
   * The model must always be a Date object, otherwise AngularJS will throw an error.
   * Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
   *
   * The timezone to be used to read/write the `Date` instance in the model can be defined using
   * {@link ng.directive:ngModelOptions#ngModelOptions-arguments ngModelOptions}. By default,
   * this is the timezone of the browser.
   *
   * The format of the displayed time can be adjusted with the
   * {@link ng.directive:ngModelOptions#ngModelOptions-arguments ngModelOptions} `timeSecondsFormat`
   * and `timeStripZeroSeconds`.
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
   *   This must be a valid ISO time format (HH:mm:ss). You can also use interpolation inside this
   *   attribute (e.g. `min="{{minTime | date:'HH:mm:ss'}}"`). Note that `min` will also add
   *   native HTML5 constraint validation.
   * @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
   *   This must be a valid ISO time format (HH:mm:ss). You can also use interpolation inside this
   *   attribute (e.g. `max="{{maxTime | date:'HH:mm:ss'}}"`). Note that `max` will also add
   *   native HTML5 constraint validation.
   * @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO time string the
   *   `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
   * @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO time string the
   *   `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
   * @param {string=} required Sets `required` validation error key if the value is not entered.
   * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
   *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
   *    `required` when you want to data-bind to the `required` attribute.
   * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
   *    interaction with the input element.
   *
   */
  time: createDateInputType(
    "time",
    TIME_REGEXP,
    createDateParser(TIME_REGEXP, ["HH", "mm", "ss", "sss"]),
    "HH:mm:ss.sss",
  ),

  /**
   * @ngdoc input
   * @name input[week]
   *
   * @description
   * Input with week-of-the-year validation and transformation to Date. In browsers that do not yet support
   * the HTML5 week input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
   * week format (yyyy-W##), for example: `2013-W02`.
   *
   * The model must always be a Date object, otherwise AngularJS will throw an error.
   * Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
   *
   * The value of the resulting Date object will be set to Thursday at 00:00:00 of the requested week,
   * due to ISO-8601 week numbering standards. Information on ISO's system for numbering the weeks of the
   * year can be found at: https://en.wikipedia.org/wiki/ISO_8601#Week_dates
   *
   * The timezone to be used to read/write the `Date` instance in the model can be defined using
   * {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
   *   This must be a valid ISO week format (yyyy-W##). You can also use interpolation inside this
   *   attribute (e.g. `min="{{minWeek | date:'yyyy-Www'}}"`). Note that `min` will also add
   *   native HTML5 constraint validation.
   * @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
   *   This must be a valid ISO week format (yyyy-W##). You can also use interpolation inside this
   *   attribute (e.g. `max="{{maxWeek | date:'yyyy-Www'}}"`). Note that `max` will also add
   *   native HTML5 constraint validation.
   * @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO week string
   *   the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
   * @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO week string
   *   the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
   * @param {string=} required Sets `required` validation error key if the value is not entered.
   * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
   *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
   *    `required` when you want to data-bind to the `required` attribute.
   * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
   *    interaction with the input element.
   */
  week: createDateInputType("week", WEEK_REGEXP, weekParser, "yyyy-Www"),

  /**
   * @ngdoc input
   * @name input[month]
   *
   * @description
   * Input with month validation and transformation. In browsers that do not yet support
   * the HTML5 month input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
   * month format (yyyy-MM), for example: `2009-01`.
   *
   * The model must always be a Date object, otherwise AngularJS will throw an error.
   * Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
   * If the model is not set to the first of the month, the next view to model update will set it
   * to the first of the month.
   *
   * The timezone to be used to read/write the `Date` instance in the model can be defined using
   * {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
   *   This must be a valid ISO month format (yyyy-MM). You can also use interpolation inside this
   *   attribute (e.g. `min="{{minMonth | date:'yyyy-MM'}}"`). Note that `min` will also add
   *   native HTML5 constraint validation.
   * @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
   *   This must be a valid ISO month format (yyyy-MM). You can also use interpolation inside this
   *   attribute (e.g. `max="{{maxMonth | date:'yyyy-MM'}}"`). Note that `max` will also add
   *   native HTML5 constraint validation.
   * @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO week string
   *   the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
   * @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO week string
   *   the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.

   * @param {string=} required Sets `required` validation error key if the value is not entered.
   * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
   *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
   *    `required` when you want to data-bind to the `required` attribute.
   * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
   *    interaction with the input element.
   *
   */
  month: createDateInputType(
    "month",
    MONTH_REGEXP,
    createDateParser(MONTH_REGEXP, ["yyyy", "MM"]),
    "yyyy-MM",
  ),

  /**
   * @ngdoc input
   * @name input[number]
   *
   * @description
   * Text input with number validation and transformation. Sets the `number` validation
   * error if not a valid number.
   *
   * <div class="alert alert-warning">
   * The model must always be of type `number` otherwise AngularJS will throw an error.
   * Be aware that a string containing a number is not enough. See the {@link ngModel:numfmt}
   * error docs for more information and an example of how to convert your model if necessary.
   * </div>
   *
   *
   *
   * @knownIssue
   *
   * ### HTML5 constraint validation and `allowInvalid`
   *
   * In browsers that follow the
   * [HTML5 specification](https://html.spec.whatwg.org/multipage/forms.html#number-state-%28type=number%29),
   * `input[number]` does not work as expected with {@link ngModelOptions `ngModelOptions.allowInvalid`}.
   * If a non-number is entered in the input, the browser will report the value as an empty string,
   * which means the view / model values in `ngModel` and subsequently the scope value
   * will also be an empty string.
   *
   * @knownIssue
   *
   * ### Large numbers and `step` validation
   *
   * The `step` validation will not work correctly for very large numbers (e.g. 9999999999) due to
   * Javascript's arithmetic limitations. If you need to handle large numbers, purpose-built
   * libraries (e.g. https://github.com/MikeMcl/big.js/), can be included into AngularJS by
   * {@link guide/forms#modifying-built-in-validators overwriting the validators}
   * for `number` and / or `step`, or by {@link guide/forms#custom-validation applying custom validators}
   * to an `input[text]` element. The source for `input[number]` type can be used as a starting
   * point for both implementations.
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
   *    Can be interpolated.
   * @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
   *    Can be interpolated.
   * @param {string=} ngMin Like `min`, sets the `min` validation error key if the value entered is less than `ngMin`,
   *    but does not trigger HTML5 native validation. Takes an expression.
   * @param {string=} ngMax Like `max`, sets the `max` validation error key if the value entered is greater than `ngMax`,
   *    but does not trigger HTML5 native validation. Takes an expression.
   * @param {string=} step Sets the `step` validation error key if the value entered does not fit the `step` constraint.
   *    Can be interpolated.
   * @param {string=} ngStep Like `step`, sets the `step` validation error key if the value entered does not fit the `ngStep` constraint,
   *    but does not trigger HTML5 native validation. Takes an expression.
   * @param {string=} required Sets `required` validation error key if the value is not entered.
   * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
   *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
   *    `required` when you want to data-bind to the `required` attribute.
   * @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
   *    minlength.
   * @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
   *    maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
   *    any length.
   * @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
   *    that contains the regular expression body that will be converted to a regular expression
   *    as in the ngPattern directive.
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
   *
   */
  number: numberInputType,

  /**
   * @ngdoc input
   * @name input[url]
   *
   * @description
   * Text input with URL validation. Sets the `url` validation error key if the content is not a
   * valid URL.
   *
   * <div class="alert alert-warning">
   * **Note:** `input[url]` uses a regex to validate urls that is derived from the regex
   * used in Chromium. If you need stricter validation, you can use `ng-pattern` or modify
   * the built-in validators (see the {@link guide/forms Forms guide})
   * </div>
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
   *    maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
   *    any length.
   * @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
   *    that contains the regular expression body that will be converted to a regular expression
   *    as in the ngPattern directive.
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
   *
   */
  url: urlInputType,

  /**
   * @ngdoc input
   * @name input[email]
   *
   * @description
   * Text input with email validation. Sets the `email` validation error key if not a valid email
   * address.
   *
   * <div class="alert alert-warning">
   * **Note:** `input[email]` uses a regex to validate email addresses that is derived from the regex
   * used in Chromium, which may not fulfill your app's requirements.
   * If you need stricter (e.g. requiring a top-level domain), or more relaxed validation
   * (e.g. allowing IPv6 address literals) you can use `ng-pattern` or
   * modify the built-in validators (see the {@link guide/forms Forms guide}).
   * </div>
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
   *    maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
   *    any length.
   * @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
   *    that contains the regular expression body that will be converted to a regular expression
   *    as in the ngPattern directive.
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
   *
   */
  email: emailInputType,

  /**
   * @ngdoc input
   * @name input[radio]
   *
   * @description
   * HTML radio button.
   *
   * **Note:**<br>
   * All inputs controlled by {@link ngModel ngModel} (including those of type `radio`) will use the
   * value of their `name` attribute to determine the property under which their
   * {@link ngModel.NgModelController NgModelController} will be published on the parent
   * {@link form.FormController FormController}. Thus, if you use the same `name` for multiple
   * inputs of a form (e.g. a group of radio inputs), only _one_ `NgModelController` will be
   * published on the parent `FormController` under that name. The rest of the controllers will
   * continue to work as expected, but you won't be able to access them as properties on the parent
   * `FormController`.
   *
   * <div class="alert alert-info">
   *   <p>
   *     In plain HTML forms, the `name` attribute is used to identify groups of radio inputs, so
   *     that the browser can manage their state (checked/unchecked) based on the state of other
   *     inputs in the same group.
   *   </p>
   *   <p>
   *     In AngularJS forms, this is not necessary. The input's state will be updated based on the
   *     value of the underlying model data.
   *   </p>
   * </div>
   *
   * <div class="alert alert-success">
   *   If you omit the `name` attribute on a radio input, `ngModel` will automatically assign it a
   *   unique name.
   * </div>
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string} value The value to which the `ngModel` expression should be set when selected.
   *    Note that `value` only supports `string` values, i.e. the scope model needs to be a string,
   *    too. Use `ngValue` if you need complex models (`number`, `object`, ...).
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
   *    interaction with the input element.
   * @param {string} ngValue AngularJS expression to which `ngModel` will be be set when the radio
   *    is selected. Should be used instead of the `value` attribute if you need
   *    a non-string `ngModel` (`boolean`, `array`, ...).
   *
   */
  radio: radioInputType,

  /**
   * @ngdoc input
   * @name input[range]
   *
   * @description
   * Native range input with validation and transformation.
   *
   * The model for the range input must always be a `Number`.
   *
   * IE9 and other browsers that do not support the `range` type fall back
   * to a text input without any default values for `min`, `max` and `step`. Model binding,
   * validation and number parsing are nevertheless supported.
   *
   * Browsers that support range (latest Chrome, Safari, Firefox, Edge) treat `input[range]`
   * in a way that never allows the input to hold an invalid value. That means:
   * - any non-numerical value is set to `(max + min) / 2`.
   * - any numerical value that is less than the current min val, or greater than the current max val
   * is set to the min / max val respectively.
   * - additionally, the current `step` is respected, so the nearest value that satisfies a step
   * is used.
   *
   * See the [HTML Spec on input[type=range]](https://www.w3.org/TR/html5/forms.html#range-state-(type=range))
   * for more info.
   *
   * This has the following consequences for AngularJS:
   *
   * Since the element value should always reflect the current model value, a range input
   * will set the bound ngModel expression to the value that the browser has set for the
   * input element. For example, in the following input `<input type="range" ng-model="model.value">`,
   * if the application sets `model.value = null`, the browser will set the input to `'50'`.
   * AngularJS will then set the model to `50`, to prevent input and model value being out of sync.
   *
   * That means the model for range will immediately be set to `50` after `ngModel` has been
   * initialized. It also means a range input can never have the required error.
   *
   * This does not only affect changes to the model value, but also to the values of the `min`,
   * `max`, and `step` attributes. When these change in a way that will cause the browser to modify
   * the input value, AngularJS will also update the model value.
   *
   * Automatic value adjustment also means that a range input element can never have the `required`,
   * `min`, or `max` errors.
   *
   * However, `step` is currently only fully implemented by Firefox. Other browsers have problems
   * when the step value changes dynamically - they do not adjust the element value correctly, but
   * instead may set the `stepMismatch` error. If that's the case, the AngularJS will set the `step`
   * error on the input, and set the model to `undefined`.
   *
   * Note that `input[range]` is not compatible with`ngMax`, `ngMin`, and `ngStep`, because they do
   * not set the `min` and `max` attributes, which means that the browser won't automatically adjust
   * the input value based on their values, and will always assume min = 0, max = 100, and step = 1.
   *
   * @param {string}  ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {string=} min Sets the `min` validation to ensure that the value entered is greater
   *                  than `min`. Can be interpolated.
   * @param {string=} max Sets the `max` validation to ensure that the value entered is less than `max`.
   *                  Can be interpolated.
   * @param {string=} step Sets the `step` validation to ensure that the value entered matches the `step`
   *                  Can be interpolated.
   * @param {expression=} ngChange AngularJS expression to be executed when the ngModel value changes due
   *                      to user interaction with the input element.
   * @param {expression=} ngChecked If the expression is truthy, then the `checked` attribute will be set on the
   *                      element. **Note** : `ngChecked` should not be used alongside `ngModel`.
   *                      Checkout {@link ng.directive:ngChecked ngChecked} for usage.
   *
   * @example
      <example name="range-input-directive" module="rangeExample">
        <file name="index.html">
          <script>
            angular.module('rangeExample', [])
              .controller('ExampleController', ['$scope', function($scope) {
                $scope.value = 75;
                $scope.min = 10;
                $scope.max = 90;
              }]);
          </script>
          <form name="myForm" ng-controller="ExampleController">

            Model as range: <input type="range" name="range" ng-model="value" min="{{min}}"  max="{{max}}">
            <hr>
            Model as number: <input type="number" ng-model="value"><br>
            Min: <input type="number" ng-model="min"><br>
            Max: <input type="number" ng-model="max"><br>
            value = <code>{{value}}</code><br/>
            myForm.range.$valid = <code>{{myForm.range.$valid}}</code><br/>
            myForm.range.$error = <code>{{myForm.range.$error}}</code>
          </form>
        </file>
      </example>

   * ## Range Input with ngMin & ngMax attributes

   * @example
      <example name="range-input-directive-ng" module="rangeExample">
        <file name="index.html">
          <script>
            angular.module('rangeExample', [])
              .controller('ExampleController', ['$scope', function($scope) {
                $scope.value = 75;
                $scope.min = 10;
                $scope.max = 90;
              }]);
          </script>
          <form name="myForm" ng-controller="ExampleController">
            Model as range: <input type="range" name="range" ng-model="value" ng-min="min" ng-max="max">
            <hr>
            Model as number: <input type="number" ng-model="value"><br>
            Min: <input type="number" ng-model="min"><br>
            Max: <input type="number" ng-model="max"><br>
            value = <code>{{value}}</code><br/>
            myForm.range.$valid = <code>{{myForm.range.$valid}}</code><br/>
            myForm.range.$error = <code>{{myForm.range.$error}}</code>
          </form>
        </file>
      </example>

   */
  range: rangeInputType,

  /**
   * @ngdoc input
   * @name input[checkbox]
   *
   * @description
   * HTML checkbox.
   *
   * @param {string} ngModel Assignable AngularJS expression to data-bind to.
   * @param {string=} name Property name of the form under which the control is published.
   * @param {expression=} ngTrueValue The value to which the expression should be set when selected.
   * @param {expression=} ngFalseValue The value to which the expression should be set when not selected.
   * @param {string=} ngChange AngularJS expression to be executed when input changes due to user
   *    interaction with the input element.
   *
   */
  checkbox: checkboxInputType,

  hidden: () => {},
  button: () => {},
  submit: () => {},
  reset: () => {},
  file: () => {},
};

function stringBasedInputType(ctrl) {
  ctrl.$formatters.push((value) =>
    ctrl.$isEmpty(value) ? value : value.toString(),
  );
}

function textInputType(scope, element, attr, ctrl, $browser) {
  baseInputType(scope, element, attr, ctrl, $browser);
  stringBasedInputType(ctrl);
}

function baseInputType(scope, element, attr, ctrl, $browser) {
  const type = lowercase(element[0].type);
  let composing = false;
  // In composition mode, users are still inputting intermediate text buffer,
  // hold the listener until composition is done.
  // More about composition events: https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
  element.on("compositionstart", () => {
    composing = true;
  });

  element.on("compositionend", () => {
    composing = false;
    listener();
  });

  let timeout;

  let listener = function (ev) {
    if (timeout) {
      $browser.cancel(timeout);
      timeout = null;
    }
    if (composing) return;
    let value = element.val();
    const event = ev && ev.type;

    // By default we will trim the value
    // If the attribute ng-trim exists we will avoid trimming
    // If input type is 'password', the value is never trimmed
    if (type !== "password" && (!attr.ngTrim || attr.ngTrim !== "false")) {
      value = trim(value);
    }

    // If a control is suffering from bad input (due to native validators), browsers discard its
    // value, so it may be necessary to revalidate (by calling $setViewValue again) even if the
    // control's value is the same empty value twice in a row.
    if (
      ctrl.$viewValue !== value ||
      (value === "" && ctrl.$$hasNativeValidators)
    ) {
      ctrl.$setViewValue(value, event);
    }
  };

  ["input", "change", "paste", "drop", "cut"].forEach((event) => {
    element.on(event, listener);
  });

  // Some native input types (date-family) have the ability to change validity without
  // firing any input/change events.
  // For these event types, when native validators are present and the browser supports the type,
  // check for validity changes on various DOM events.
  if (
    PARTIAL_VALIDATION_TYPES[type] &&
    ctrl.$$hasNativeValidators &&
    type === attr.type
  ) {
    element.on(PARTIAL_VALIDATION_EVENTS, function (ev) {
      if (!timeout) {
        const validity = this[VALIDITY_STATE_PROPERTY];
        const origBadInput = validity.badInput;
        const origTypeMismatch = validity.typeMismatch;
        timeout = $browser.defer(() => {
          timeout = null;
          if (
            validity.badInput !== origBadInput ||
            validity.typeMismatch !== origTypeMismatch
          ) {
            listener(ev);
          }
        });
      }
    });
  }

  ctrl.$render = function () {
    // Workaround for Firefox validation #12102.
    const value = ctrl.$isEmpty(ctrl.$viewValue) ? "" : ctrl.$viewValue;
    if (element.val() !== value) {
      element.val(value);
    }
  };
}

export function weekParser(isoWeek, existingDate) {
  if (isDate(isoWeek)) {
    return isoWeek;
  }

  function getFirstThursdayOfYear(year) {
    // 0 = index of January
    var dayOfWeekOnFirst = new Date(year, 0, 1).getDay();
    // 4 = index of Thursday (+1 to account for 1st = 5)
    // 11 = index of *next* Thursday (+1 account for 1st = 12)
    return new Date(
      year,
      0,
      (dayOfWeekOnFirst <= 4 ? 5 : 12) - dayOfWeekOnFirst,
    );
  }

  if (isString(isoWeek)) {
    WEEK_REGEXP.lastIndex = 0;
    const parts = WEEK_REGEXP.exec(isoWeek);
    if (parts) {
      const year = +parts[1];
      const week = +parts[2];
      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      let milliseconds = 0;
      const firstThurs = getFirstThursdayOfYear(year);
      const addDays = (week - 1) * 7;

      if (existingDate) {
        hours = existingDate.getHours();
        minutes = existingDate.getMinutes();
        seconds = existingDate.getSeconds();
        milliseconds = existingDate.getMilliseconds();
      }

      return new Date(
        year,
        0,
        firstThurs.getDate() + addDays,
        hours,
        minutes,
        seconds,
        milliseconds,
      );
    }
  }

  return NaN;
}

export function createDateParser(regexp, mapping) {
  return function (iso, previousDate) {
    let parts;
    let map;

    if (isDate(iso)) {
      return iso;
    }

    if (isString(iso)) {
      // When a date is JSON'ified to wraps itself inside of an extra
      // set of double quotes. This makes the date parsing code unable
      // to match the date string and parse it as a date.
      if (iso.charAt(0) === '"' && iso.charAt(iso.length - 1) === '"') {
        iso = iso.substring(1, iso.length - 1);
      }
      if (ISO_DATE_REGEXP.test(iso)) {
        return new Date(iso);
      }
      regexp.lastIndex = 0;
      parts = regexp.exec(iso);

      if (parts) {
        parts.shift();
        if (previousDate) {
          map = {
            yyyy: previousDate.getFullYear(),
            MM: previousDate.getMonth() + 1,
            dd: previousDate.getDate(),
            HH: previousDate.getHours(),
            mm: previousDate.getMinutes(),
            ss: previousDate.getSeconds(),
            sss: previousDate.getMilliseconds() / 1000,
          };
        } else {
          map = { yyyy: 1970, MM: 1, dd: 1, HH: 0, mm: 0, ss: 0, sss: 0 };
        }

        forEach(parts, (part, index) => {
          if (index < mapping.length) {
            map[mapping[index]] = +part;
          }
        });

        const date = new Date(
          map.yyyy,
          map.MM - 1,
          map.dd,
          map.HH,
          map.mm,
          map.ss || 0,
          map.sss * 1000 || 0,
        );
        if (map.yyyy < 100) {
          // In the constructor, 2-digit years map to 1900-1999.
          // Use `setFullYear()` to set the correct year.
          date.setFullYear(map.yyyy);
        }

        return date;
      }
    }

    return NaN;
  };
}

const MONTH_INPUT_FORMAT = /\b\d{4}-(0[1-9]|1[0-2])\b/;

export function createDateInputType(type, regexp, parseDate) {
  return function dynamicDateInputType(
    scope,
    element,
    attr,
    ctrl,
    $browser,
    $filter,
    $parse,
  ) {
    badInputChecker(scope, element, attr, ctrl, type);
    baseInputType(scope, element, attr, ctrl, $browser);
    let previousDate;
    let previousTimezone;

    ctrl.$parsers.push((value) => {
      if (ctrl.$isEmpty(value)) return null;

      if (regexp.test(value)) {
        // Do not convert for native HTML
        if (["month", "week", "datetimelocal", "time", "date"].includes(type)) {
          return value;
        }

        // Note: We cannot read ctrl.$modelValue, as there might be a different
        // parser/formatter in the processing chain so that the model
        // contains some different data format!
        return parseDateAndConvertTimeZoneToLocal(value, previousDate);
      }
      ctrl.$$parserName = type;
      return undefined;
    });

    ctrl.$formatters.push(function (value) {
      if (value && !isString(value)) {
        throw ngModelMinErr("datefmt", "Expected `{0}` to be a String", value);
      }

      if (type === "month") {
        if (value == null) {
          return "";
        }
        if (!MONTH_INPUT_FORMAT.test(value)) {
          throw ngModelMinErr(
            "datefmt",
            "Expected month `{0}` to be a 'YYYY-DD'",
            value,
          );
        }
      }

      if (type === "week") {
        if (value == null) {
          return "";
        }
        if (!WEEK_REGEXP.test(value)) {
          throw ngModelMinErr(
            "datefmt",
            "Expected week `{0}` to be a 'yyyy-Www'",
            value,
          );
        }
      }

      if (type === "datetimelocal") {
        if (value == null) {
          return "";
        }
        if (!DATETIMELOCAL_REGEXP.test(value)) {
          throw ngModelMinErr(
            "datefmt",
            "Expected week `{0}` to be a in date time format. See: https://developer.mozilla.org/en-US/docs/Web/HTML/Date_and_time_formats#local_date_and_time_strings",
            value,
          );
        }
      }

      return value;

      // if (isValidDate(value)) {
      //   previousDate = value;
      //   const timezone = ctrl.$options.getOption("timezone");

      //   if (timezone) {
      //     previousTimezone = timezone;
      //     previousDate = convertTimezoneToLocal(previousDate, timezone, true);
      //   }

      //   return value;
      // }
      // previousDate = null;
      // previousTimezone = null;
      // return "";
    });

    if (isDefined(attr.min) || attr.ngMin) {
      let minVal = attr.min || $parse(attr.ngMin)(scope);
      let parsedMinVal = parseObservedDateValue(minVal);

      ctrl.$validators.min = function (value) {
        if (type === "month") {
          return (
            isUndefined(parsedMinVal) ||
            parseDate(value) >= parseDate(parsedMinVal)
          );
        }

        return (
          !isValidDate(value) ||
          isUndefined(parsedMinVal) ||
          parseDate(value) >= parsedMinVal
        );
      };
      attr.$observe("min", (val) => {
        if (val !== minVal) {
          parsedMinVal = parseObservedDateValue(val);
          minVal = val;
          ctrl.$validate();
        }
      });
    }

    if (isDefined(attr.max) || attr.ngMax) {
      let maxVal = attr.max || $parse(attr.ngMax)(scope);
      let parsedMaxVal = parseObservedDateValue(maxVal);

      ctrl.$validators.max = function (value) {
        if (type === "month") {
          return (
            isUndefined(parsedMaxVal) ||
            parseDate(value) <= parseDate(parsedMaxVal)
          );
        }
        return (
          !isValidDate(value) ||
          isUndefined(parsedMaxVal) ||
          parseDate(value) <= parsedMaxVal
        );
      };
      attr.$observe("max", (val) => {
        if (val !== maxVal) {
          parsedMaxVal = parseObservedDateValue(val);
          maxVal = val;
          ctrl.$validate();
        }
      });
    }

    function isValidDate(value) {
      // Invalid Date: getTime() returns NaN
      return value && !(value.getTime && value.getTime() !== value.getTime());
    }

    function parseObservedDateValue(val) {
      return isDefined(val) && !isDate(val)
        ? parseDateAndConvertTimeZoneToLocal(val) || undefined
        : val;
    }

    function parseDateAndConvertTimeZoneToLocal(value, previousDate) {
      const timezone = ctrl.$options.getOption("timezone");

      if (previousTimezone && previousTimezone !== timezone) {
        // If the timezone has changed, adjust the previousDate to the default timezone
        // so that the new date is converted with the correct timezone offset
        previousDate = addDateMinutes(
          previousDate,
          timezoneToOffset(previousTimezone),
        );
      }

      let parsedDate = parseDate(value, previousDate);

      if (!Number.isNaN(parsedDate) && timezone) {
        parsedDate = convertTimezoneToLocal(parsedDate, timezone);
      }
      return parsedDate;
    }
  };
}

export function badInputChecker(scope, element, attr, ctrl, parserName) {
  const node = element[0];
  const nativeValidation = (ctrl.$$hasNativeValidators = isObject(
    node.validity,
  ));

  if (nativeValidation) {
    ctrl.$parsers.push((value) => {
      const validity = element[0][VALIDITY_STATE_PROPERTY] || {};
      if (validity.badInput || validity.typeMismatch) {
        ctrl.$$parserName = parserName;
        return undefined;
      }

      return value;
    });
  }
}

export function numberFormatterParser(ctrl) {
  ctrl.$parsers.push((value) => {
    if (ctrl.$isEmpty(value)) return null;
    if (NUMBER_REGEXP.test(value)) return parseFloat(value);

    ctrl.$$parserName = "number";
    return undefined;
  });

  ctrl.$formatters.push((value) => {
    if (!ctrl.$isEmpty(value)) {
      if (!isNumber(value)) {
        throw ngModelMinErr("numfmt", "Expected `{0}` to be a number", value);
      }
      value = value.toString();
    }
    return value;
  });
}

function parseNumberAttrVal(val) {
  if (isDefined(val) && !isNumber(val)) {
    val = parseFloat(val);
  }
  return !isNumberNaN(val) ? val : undefined;
}

export function isNumberInteger(num) {
  // See http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript#14794066
  // (minus the assumption that `num` is a number)

  return (num | 0) === num;
}

export function countDecimals(num) {
  const numString = num.toString();
  const decimalSymbolIndex = numString.indexOf(".");

  if (decimalSymbolIndex === -1) {
    if (num > -1 && num < 1) {
      // It may be in the exponential notation format (`1e-X`)
      const match = /e-(\d+)$/.exec(numString);

      if (match) {
        return Number(match[1]);
      }
    }

    return 0;
  }

  return numString.length - decimalSymbolIndex - 1;
}

export function isValidForStep(viewValue, stepBase, step) {
  // At this point `stepBase` and `step` are expected to be non-NaN values
  // and `viewValue` is expected to be a valid stringified number.
  let value = Number(viewValue);

  const isNonIntegerValue = !isNumberInteger(value);
  const isNonIntegerStepBase = !isNumberInteger(stepBase);
  const isNonIntegerStep = !isNumberInteger(step);

  // Due to limitations in Floating Point Arithmetic (e.g. `0.3 - 0.2 !== 0.1` or
  // `0.5 % 0.1 !== 0`), we need to convert all numbers to integers.
  if (isNonIntegerValue || isNonIntegerStepBase || isNonIntegerStep) {
    const valueDecimals = isNonIntegerValue ? countDecimals(value) : 0;
    const stepBaseDecimals = isNonIntegerStepBase ? countDecimals(stepBase) : 0;
    const stepDecimals = isNonIntegerStep ? countDecimals(step) : 0;

    const decimalCount = Math.max(
      valueDecimals,
      stepBaseDecimals,
      stepDecimals,
    );
    const multiplier = 10 ** decimalCount;

    value *= multiplier;
    stepBase *= multiplier;
    step *= multiplier;

    if (isNonIntegerValue) value = Math.round(value);
    if (isNonIntegerStepBase) stepBase = Math.round(stepBase);
    if (isNonIntegerStep) step = Math.round(step);
  }

  return (value - stepBase) % step === 0;
}

export function numberInputType(
  scope,
  element,
  attr,
  ctrl,
  $browser,
  $filter,
  $parse,
) {
  badInputChecker(scope, element, attr, ctrl, "number");
  numberFormatterParser(ctrl);
  baseInputType(scope, element, attr, ctrl, $browser);

  let parsedMinVal;

  if (isDefined(attr.min) || attr.ngMin) {
    let minVal = attr.min || $parse(attr.ngMin)(scope);
    parsedMinVal = parseNumberAttrVal(minVal);

    ctrl.$validators.min = function (modelValue, viewValue) {
      return (
        ctrl.$isEmpty(viewValue) ||
        isUndefined(parsedMinVal) ||
        viewValue >= parsedMinVal
      );
    };

    attr.$observe("min", (val) => {
      if (val !== minVal) {
        parsedMinVal = parseNumberAttrVal(val);
        minVal = val;
        // TODO(matsko): implement validateLater to reduce number of validations
        ctrl.$validate();
      }
    });
  }

  if (isDefined(attr.max) || attr.ngMax) {
    let maxVal = attr.max || $parse(attr.ngMax)(scope);
    let parsedMaxVal = parseNumberAttrVal(maxVal);

    ctrl.$validators.max = function (modelValue, viewValue) {
      return (
        ctrl.$isEmpty(viewValue) ||
        isUndefined(parsedMaxVal) ||
        viewValue <= parsedMaxVal
      );
    };

    attr.$observe("max", (val) => {
      if (val !== maxVal) {
        parsedMaxVal = parseNumberAttrVal(val);
        maxVal = val;
        // TODO(matsko): implement validateLater to reduce number of validations
        ctrl.$validate();
      }
    });
  }

  if (isDefined(attr.step) || attr.ngStep) {
    let stepVal = attr.step || $parse(attr.ngStep)(scope);
    let parsedStepVal = parseNumberAttrVal(stepVal);

    ctrl.$validators.step = function (modelValue, viewValue) {
      return (
        ctrl.$isEmpty(viewValue) ||
        isUndefined(parsedStepVal) ||
        isValidForStep(viewValue, parsedMinVal || 0, parsedStepVal)
      );
    };

    attr.$observe("step", (val) => {
      // TODO(matsko): implement validateLater to reduce number of validations
      if (val !== stepVal) {
        parsedStepVal = parseNumberAttrVal(val);
        stepVal = val;
        ctrl.$validate();
      }
    });
  }
}

export function rangeInputType(scope, element, attr, ctrl, $browser) {
  badInputChecker(scope, element, attr, ctrl, "range");
  numberFormatterParser(ctrl);
  baseInputType(scope, element, attr, ctrl, $browser);

  const supportsRange =
    ctrl.$$hasNativeValidators && element[0].type === "range";
  let minVal = supportsRange ? 0 : undefined;
  let maxVal = supportsRange ? 100 : undefined;
  let stepVal = supportsRange ? 1 : undefined;
  const { validity } = element[0];
  const hasMinAttr = isDefined(attr.min);
  const hasMaxAttr = isDefined(attr.max);
  const hasStepAttr = isDefined(attr.step);

  const originalRender = ctrl.$render;

  ctrl.$render =
    supportsRange &&
    isDefined(validity.rangeUnderflow) &&
    isDefined(validity.rangeOverflow)
      ? // Browsers that implement range will set these values automatically, but reading the adjusted values after
        // $render would cause the min / max validators to be applied with the wrong value
        function rangeRender() {
          originalRender();
          ctrl.$setViewValue(element.val());
        }
      : originalRender;

  if (hasMinAttr) {
    minVal = parseNumberAttrVal(attr.min);

    ctrl.$validators.min = supportsRange
      ? // Since all browsers set the input to a valid value, we don't need to check validity
        function noopMinValidator() {
          return true;
        }
      : // non-support browsers validate the min val
        function minValidator(modelValue, viewValue) {
          return (
            ctrl.$isEmpty(viewValue) ||
            isUndefined(minVal) ||
            viewValue >= minVal
          );
        };

    setInitialValueAndObserver("min", minChange);
  }

  if (hasMaxAttr) {
    maxVal = parseNumberAttrVal(attr.max);

    ctrl.$validators.max = supportsRange
      ? // Since all browsers set the input to a valid value, we don't need to check validity
        function noopMaxValidator() {
          return true;
        }
      : // non-support browsers validate the max val
        function maxValidator(modelValue, viewValue) {
          return (
            ctrl.$isEmpty(viewValue) ||
            isUndefined(maxVal) ||
            viewValue <= maxVal
          );
        };

    setInitialValueAndObserver("max", maxChange);
  }

  if (hasStepAttr) {
    stepVal = parseNumberAttrVal(attr.step);

    ctrl.$validators.step = supportsRange
      ? function nativeStepValidator() {
          // Currently, only FF implements the spec on step change correctly (i.e. adjusting the
          // input element value to a valid value). It's possible that other browsers set the stepMismatch
          // validity error instead, so we can at least report an error in that case.
          return !validity.stepMismatch;
        }
      : // ngStep doesn't set the setp attr, so the browser doesn't adjust the input value as setting step would
        function stepValidator(modelValue, viewValue) {
          return (
            ctrl.$isEmpty(viewValue) ||
            isUndefined(stepVal) ||
            isValidForStep(viewValue, minVal || 0, stepVal)
          );
        };

    setInitialValueAndObserver("step", stepChange);
  }

  function setInitialValueAndObserver(htmlAttrName, changeFn) {
    // interpolated attributes set the attribute value only after a digest, but we need the
    // attribute value when the input is first rendered, so that the browser can adjust the
    // input value based on the min/max value
    element.attr(htmlAttrName, attr[htmlAttrName]);
    let oldVal = attr[htmlAttrName];
    attr.$observe(htmlAttrName, (val) => {
      if (val !== oldVal) {
        oldVal = val;
        changeFn(val);
      }
    });
  }

  function minChange(val) {
    minVal = parseNumberAttrVal(val);
    // ignore changes before model is initialized
    if (isNumberNaN(ctrl.$modelValue)) {
      return;
    }

    if (supportsRange) {
      let elVal = element.val();
      // IE11 doesn't set the el val correctly if the minVal is greater than the element value
      if (minVal > elVal) {
        elVal = minVal;
        element.val(elVal);
      }
      ctrl.$setViewValue(elVal);
    } else {
      // TODO(matsko): implement validateLater to reduce number of validations
      ctrl.$validate();
    }
  }

  function maxChange(val) {
    maxVal = parseNumberAttrVal(val);
    // ignore changes before model is initialized
    if (isNumberNaN(ctrl.$modelValue)) {
      return;
    }

    if (supportsRange) {
      let elVal = element.val();
      // IE11 doesn't set the el val correctly if the maxVal is less than the element value
      if (maxVal < elVal) {
        element.val(maxVal);
        // IE11 and Chrome don't set the value to the minVal when max < min
        elVal = maxVal < minVal ? minVal : maxVal;
      }
      ctrl.$setViewValue(elVal);
    } else {
      // TODO(matsko): implement validateLater to reduce number of validations
      ctrl.$validate();
    }
  }

  function stepChange(val) {
    stepVal = parseNumberAttrVal(val);
    // ignore changes before model is initialized
    if (isNumberNaN(ctrl.$modelValue)) {
      return;
    }

    // Some browsers don't adjust the input value correctly, but set the stepMismatch error
    if (!supportsRange) {
      // TODO(matsko): implement validateLater to reduce number of validations
      ctrl.$validate();
    } else if (ctrl.$viewValue !== element.val()) {
      ctrl.$setViewValue(element.val());
    }
  }
}

function urlInputType(scope, element, attr, ctrl, $browser) {
  // Note: no badInputChecker here by purpose as `url` is only a validation
  // in browsers, i.e. we can always read out input.value even if it is not valid!
  baseInputType(scope, element, attr, ctrl, $browser);
  stringBasedInputType(ctrl);

  ctrl.$validators.url = function (modelValue, viewValue) {
    const value = modelValue || viewValue;
    return ctrl.$isEmpty(value) || URL_REGEXP.test(value);
  };
}

function emailInputType(scope, element, attr, ctrl, $browser) {
  // Note: no badInputChecker here by purpose as `url` is only a validation
  // in browsers, i.e. we can always read out input.value even if it is not valid!
  baseInputType(scope, element, attr, ctrl, $browser);
  stringBasedInputType(ctrl);

  ctrl.$validators.email = function (modelValue, viewValue) {
    const value = modelValue || viewValue;
    return ctrl.$isEmpty(value) || EMAIL_REGEXP.test(value);
  };
}

function radioInputType(scope, element, attr, ctrl) {
  const doTrim = !attr.ngTrim || trim(attr.ngTrim) !== "false";
  // make the name unique, if not defined
  if (isUndefined(attr.name)) {
    element.attr("name", nextUid());
  }

  const listener = function (ev) {
    let value;
    if (element[0].checked) {
      value = attr.value;
      if (doTrim) {
        value = trim(value);
      }
      ctrl.$setViewValue(value, ev && ev.type);
    }
  };

  element.on("change", listener);

  ctrl.$render = function () {
    let { value } = attr;
    if (doTrim) {
      value = trim(value);
    }
    element[0].checked = value === ctrl.$viewValue;
  };

  attr.$observe("value", ctrl.$render);
}

function parseConstantExpr($parse, context, name, expression, fallback) {
  let parseFn;
  if (isDefined(expression)) {
    parseFn = $parse(expression);
    if (!parseFn.constant) {
      throw ngModelMinErr(
        "constexpr",
        "Expected constant expression for `{0}`, but saw " + "`{1}`.",
        name,
        expression,
      );
    }
    return parseFn(context);
  }
  return fallback;
}

function checkboxInputType(
  scope,
  element,
  attr,
  ctrl,
  $browser,
  $filter,
  $parse,
) {
  const trueValue = parseConstantExpr(
    $parse,
    scope,
    "ngTrueValue",
    attr.ngTrueValue,
    true,
  );
  const falseValue = parseConstantExpr(
    $parse,
    scope,
    "ngFalseValue",
    attr.ngFalseValue,
    false,
  );

  const listener = function (ev) {
    ctrl.$setViewValue(element[0].checked, ev && ev.type);
  };

  element.on("change", listener);

  ctrl.$render = function () {
    element[0].checked = ctrl.$viewValue;
  };

  // Override the standard `$isEmpty` because the $viewValue of an empty checkbox is always set to `false`
  // This is because of the parser below, which compares the `$modelValue` with `trueValue` to convert
  // it to a boolean.
  ctrl.$isEmpty = function (value) {
    return value === false;
  };

  ctrl.$formatters.push((value) => equals(value, trueValue));

  ctrl.$parsers.push((value) => (value ? trueValue : falseValue));
}

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
export const inputDirective = [
  "$browser",
  "$filter",
  "$parse",
  function ($browser, $filter, $parse) {
    return {
      restrict: "E",
      require: ["?ngModel"],
      link: {
        pre(scope, element, attr, ctrls) {
          if (ctrls[0]) {
            (inputType[lowercase(attr.type)] || inputType.text)(
              scope,
              element,
              attr,
              ctrls[0],
              $browser,
              $filter,
              $parse,
            );
          }
        },
      },
    };
  },
];

export function hiddenInputBrowserCacheDirective() {
  const valueProperty = {
    configurable: true,
    enumerable: false,
    get() {
      return this.getAttribute("value") || "";
    },
    set(val) {
      this.setAttribute("value", val);
    },
  };

  return {
    restrict: "E",
    priority: 200,
    compile(_, attr) {
      if (lowercase(attr.type) !== "hidden") {
        return;
      }

      return {
        pre(scope, element) {
          const node = element[0];

          // Support: Edge
          // Moving the DOM around prevents autofillling
          if (node.parentNode) {
            node.parentNode.insertBefore(node, node.nextSibling);
          }

          // Support: FF, IE
          // Avoiding direct assignment to .value prevents autofillling
          if (Object.defineProperty) {
            Object.defineProperty(node, "value", valueProperty);
          }
        },
      };
    },
  };
}

const CONSTANT_VALUE_REGEXP = /^(true|false|\d+)$/;
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
export function ngValueDirective() {
  /**
   *  inputs use the value attribute as their default value if the value property is not set.
   *  Once the value property has been set (by adding input), it will not react to changes to
   *  the value attribute anymore. Setting both attribute and property fixes this behavior, and
   *  makes it possible to use ngValue as a sort of one-way bind.
   */
  function updateElementValue(element, attr, value) {
    // Support: IE9 only
    // In IE9 values are converted to string (e.g. `input.value = null` results in `input.value === 'null'`).
    const propValue = isDefined(value) ? value : null;
    element[0]["value"] = propValue;
    attr.$set("value", value);
  }

  return {
    restrict: "A",
    priority: 100,
    compile(tpl, tplAttr) {
      if (CONSTANT_VALUE_REGEXP.test(tplAttr.ngValue)) {
        return function ngValueConstantLink(scope, elm, attr) {
          const value = scope.$eval(attr.ngValue);
          updateElementValue(elm, attr, value);
        };
      }
      return function ngValueLink(scope, elm, attr) {
        scope.$watch(attr.ngValue, (value) => {
          updateElementValue(elm, attr, value);
        });
      };
    },
  };
}
