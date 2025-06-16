/\*\*

- @ngdoc input
- @name input[text]
-
- @description
- Standard HTML text input with AngularTS data binding, inherited by most of the `input` elements.
-
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} required Adds `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
- minlength.
- @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
- maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
- any length.
- @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
- that contains the regular expression body that will be converted to a regular expression
- as in the ngPattern directive.
- @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
- does not match a RegExp found by evaluating the AngularTS expression given in the attribute value.
- If the expression evaluates to a RegExp object, then this is used directly.
- If the expression evaluates to a string, then it will be converted to a RegExp
- after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
- `new RegExp('^abc$')`.<br />
- **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
- start at the index of the last search's match, thus not taking the whole input value into
- account.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- @param {boolean=} [ngTrim=true] If set to false AngularTS will not automatically trim the input.
- This parameter is ignored for input[type=password] controls, which will never trim the
- input.
  \*/

/\*\*

- @ngdoc input
- @name input[datetime-local]
-
- @description
- Input with datetime validation and transformation. In browsers that do not yet support
- the HTML5 date input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
- local datetime format (yyyy-MM-ddTHH:mm:ss), for example: `2010-12-28T14:57:00`.
-
- The model must always be a Date object, otherwise AngularTS will throw an error.
- Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
-
- The timezone to be used to read/write the `Date` instance in the model can be defined using
- {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
-
- The format of the displayed time can be adjusted with the
- {@link ng.directive:ngModelOptions#ngModelOptions-arguments ngModelOptions} `timeSecondsFormat`
- and `timeStripZeroSeconds`.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
- This must be a valid ISO datetime format (yyyy-MM-ddTHH:mm:ss). You can also use interpolation
- inside this attribute (e.g. `min="{{minDatetimeLocal | date:'yyyy-MM-ddTHH:mm:ss'}}"`).
- Note that `min` will also add native HTML5 constraint validation.
- @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
- This must be a valid ISO datetime format (yyyy-MM-ddTHH:mm:ss). You can also use interpolation
- inside this attribute (e.g. `max="{{maxDatetimeLocal | date:'yyyy-MM-ddTHH:mm:ss'}}"`).
- Note that `max` will also add native HTML5 constraint validation.
- @param {(date|string)=} ngMin Sets the `min` validation error key to the Date / ISO datetime string
- the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
- @param {(date|string)=} ngMax Sets the `max` validation error key to the Date / ISO datetime string
- the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/
  /\*\*
- @ngdoc input
- @name input[time]
-
- @description
- Input with time validation and transformation. In browsers that do not yet support
- the HTML5 time input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
- local time format (HH:mm:ss), for example: `14:57:00`. Model must be a Date object. This binding will always output a
- Date object to the model of January 1, 1970, or local date `new Date(1970, 0, 1, HH, mm, ss)`.
-
- The model must always be a Date object, otherwise AngularTS will throw an error.
- Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
-
- The timezone to be used to read/write the `Date` instance in the model can be defined using
- {@link ng.directive:ngModelOptions#ngModelOptions-arguments ngModelOptions}. By default,
- this is the timezone of the browser.
-
- The format of the displayed time can be adjusted with the
- {@link ng.directive:ngModelOptions#ngModelOptions-arguments ngModelOptions} `timeSecondsFormat`
- and `timeStripZeroSeconds`.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
- This must be a valid ISO time format (HH:mm:ss). You can also use interpolation inside this
- attribute (e.g. `min="{{minTime | date:'HH:mm:ss'}}"`). Note that `min` will also add
- native HTML5 constraint validation.
- @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
- This must be a valid ISO time format (HH:mm:ss). You can also use interpolation inside this
- attribute (e.g. `max="{{maxTime | date:'HH:mm:ss'}}"`). Note that `max` will also add
- native HTML5 constraint validation.
- @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO time string the
- `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
- @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO time string the
- `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/

/\*\*

- @ngdoc input
- @name input[week]
-
- @description
- Input with week-of-the-year validation and transformation to Date. In browsers that do not yet support
- the HTML5 week input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
- week format (yyyy-W##), for example: `2013-W02`.
-
- The model must always be a Date object, otherwise AngularTS will throw an error.
- Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
-
- The value of the resulting Date object will be set to Thursday at 00:00:00 of the requested week,
- due to ISO-8601 week numbering standards. Information on ISO's system for numbering the weeks of the
- year can be found at: https://en.wikipedia.org/wiki/ISO_8601#Week_dates
-
- The timezone to be used to read/write the `Date` instance in the model can be defined using
- {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
- This must be a valid ISO week format (yyyy-W##). You can also use interpolation inside this
- attribute (e.g. `min="{{minWeek | date:'yyyy-Www'}}"`). Note that `min` will also add
- native HTML5 constraint validation.
- @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
- This must be a valid ISO week format (yyyy-W##). You can also use interpolation inside this
- attribute (e.g. `max="{{maxWeek | date:'yyyy-Www'}}"`). Note that `max` will also add
- native HTML5 constraint validation.
- @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO week string
- the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
- @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO week string
- the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
  \*/
  /\*\*
- @ngdoc input
- @name input[month]
-
- @description
- Input with month validation and transformation. In browsers that do not yet support
- the HTML5 month input, a text element will be used. In that case, the text must be entered in a valid ISO-8601
- month format (yyyy-MM), for example: `2009-01`.
-
- The model must always be a Date object, otherwise AngularTS will throw an error.
- Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
- If the model is not set to the first of the month, the next view to model update will set it
- to the first of the month.
-
- The timezone to be used to read/write the `Date` instance in the model can be defined using
- {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
- This must be a valid ISO month format (yyyy-MM). You can also use interpolation inside this
- attribute (e.g. `min="{{minMonth | date:'yyyy-MM'}}"`). Note that `min` will also add
- native HTML5 constraint validation.
- @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
- This must be a valid ISO month format (yyyy-MM). You can also use interpolation inside this
- attribute (e.g. `max="{{maxMonth | date:'yyyy-MM'}}"`). Note that `max` will also add
- native HTML5 constraint validation.
- @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO week string
- the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
- @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO week string
- the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.

- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/

/\*\*

- @ngdoc input
- @name input[number]
-
- @description
- Text input with number validation and transformation. Sets the `number` validation
- error if not a valid number.
-
- <div class="alert alert-warning">
- The model must always be of type `number` otherwise AngularTS will throw an error.
- Be aware that a string containing a number is not enough. See the {@link ngModel:numfmt}
- error docs for more information and an example of how to convert your model if necessary.
- </div>
-
-
-
- @knownIssue
-
- ### HTML5 constraint validation and `allowInvalid`
-
- In browsers that follow the
- [HTML5 specification](https://html.spec.whatwg.org/multipage/forms.html#number-state-%28type=number%29),
- `input[number]` does not work as expected with {@link ngModelOptions `ngModelOptions.allowInvalid`}.
- If a non-number is entered in the input, the browser will report the value as an empty string,
- which means the view / model values in `ngModel` and subsequently the scope value
- will also be an empty string.
-
- @knownIssue
-
- ### Large numbers and `step` validation
-
- The `step` validation will not work correctly for very large numbers (e.g. 9999999999) due to
- Javascript's arithmetic limitations. If you need to handle large numbers, purpose-built
- libraries (e.g. https://github.com/MikeMcl/big.js/), can be included into AngularTS by
- {@link guide/forms#modifying-built-in-validators overwriting the validators}
- for `number` and / or `step`, or by {@link guide/forms#custom-validation applying custom validators}
- to an `input[text]` element. The source for `input[number]` type can be used as a starting
- point for both implementations.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} min Sets the `min` validation error key if the value entered is less than `min`.
- Can be interpolated.
- @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`.
- Can be interpolated.
- @param {string=} ngMin Like `min`, sets the `min` validation error key if the value entered is less than `ngMin`,
- but does not trigger HTML5 native validation. Takes an expression.
- @param {string=} ngMax Like `max`, sets the `max` validation error key if the value entered is greater than `ngMax`,
- but does not trigger HTML5 native validation. Takes an expression.
- @param {string=} step Sets the `step` validation error key if the value entered does not it the `step` constraint.
- Can be interpolated.
- @param {string=} ngStep Like `step`, sets the `step` validation error key if the value entered does not it the `ngStep` constraint,
- but does not trigger HTML5 native validation. Takes an expression.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
- minlength.
- @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
- maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
- any length.
- @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
- that contains the regular expression body that will be converted to a regular expression
- as in the ngPattern directive.
- @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
- does not match a RegExp found by evaluating the AngularTS expression given in the attribute value.
- If the expression evaluates to a RegExp object, then this is used directly.
- If the expression evaluates to a string, then it will be converted to a RegExp
- after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
- `new RegExp('^abc$')`.<br />
- **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
- start at the index of the last search's match, thus not taking the whole input value into
- account.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/

/\*\*

- @ngdoc input
- @name input[url]
-
- @description
- Text input with URL validation. Sets the `url` validation error key if the content is not a
- valid URL.
-
- <div class="alert alert-warning">
- **Note:** `input[url]` uses a regex to validate urls that is derived from the regex
- used in Chromium. If you need stricter validation, you can use `ng-pattern` or modify
- the built-in validators (see the {@link guide/forms Forms guide})
- </div>
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
- minlength.
- @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
- maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
- any length.
- @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
- that contains the regular expression body that will be converted to a regular expression
- as in the ngPattern directive.
- @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
- does not match a RegExp found by evaluating the AngularTS expression given in the attribute value.
- If the expression evaluates to a RegExp object, then this is used directly.
- If the expression evaluates to a string, then it will be converted to a RegExp
- after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
- `new RegExp('^abc$')`.<br />
- **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
- start at the index of the last search's match, thus not taking the whole input value into
- account.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/

/\*\*

- @ngdoc input
- @name input[email]
-
- @description
- Text input with email validation. Sets the `email` validation error key if not a valid email
- address.
-
- <div class="alert alert-warning">
- **Note:** `input[email]` uses a regex to validate email addresses that is derived from the regex
- used in Chromium, which may not fulfill your app's requirements.
- If you need stricter (e.g. requiring a top-level domain), or more relaxed validation
- (e.g. allowing IPv6 address literals) you can use `ng-pattern` or
- modify the built-in validators (see the {@link guide/forms Forms guide}).
- </div>
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
- minlength.
- @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
- maxlength. Setting the attribute to a negative or non-numeric value, allows view values of
- any length.
- @param {string=} pattern Similar to `ngPattern` except that the attribute value is the actual string
- that contains the regular expression body that will be converted to a regular expression
- as in the ngPattern directive.
- @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
- does not match a RegExp found by evaluating the AngularTS expression given in the attribute value.
- If the expression evaluates to a RegExp object, then this is used directly.
- If the expression evaluates to a string, then it will be converted to a RegExp
- after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
- `new RegExp('^abc$')`.<br />
- **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
- start at the index of the last search's match, thus not taking the whole input value into
- account.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/

  /\*\*

- @ngdoc input
- @name input[radio]
-
- @description
- HTML radio button.
-
- **Note:**<br>
- All inputs controlled by {@link ngModel ngModel} (including those of type `radio`) will use the
- value of their `name` attribute to determine the property under which their
- {@link ngModel.NgModelController NgModelController} will be published on the parent
- {@link form.FormController FormController}. Thus, if you use the same `name` for multiple
- inputs of a form (e.g. a group of radio inputs), only _one_ `NgModelController` will be
- published on the parent `FormController` under that name. The rest of the controllers will
- continue to work as expected, but you won't be able to access them as properties on the parent
- `FormController`.
-
- <div class="alert alert-info">
- <p>
-     In plain HTML forms, the `name` attribute is used to identify groups of radio inputs, so
-     that the browser can manage their state (checked/unchecked) based on the state of other
-     inputs in the same group.
- </p>
- <p>
-     In AngularTS forms, this is not necessary. The input's state will be updated based on the
-     value of the underlying model data.
- </p>
- </div>
-
- <div class="alert alert-success">
- If you omit the `name` attribute on a radio input, `ngModel` will automatically assign it a
- unique name.
- </div>
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string} value The value to which the `ngModel` expression should be set when selected.
- Note that `value` only supports `string` values, i.e. the scope model needs to be a string,
- too. Use `ngValue` if you need complex models (`number`, `object`, ...).
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- @param {string} ngValue AngularTS expression to which `ngModel` will be be set when the radio
- is selected. Should be used instead of the `value` attribute if you need
- a non-string `ngModel` (`boolean`, `array`, ...).
- \*/

/\*\*

- @ngdoc input
- @name input[range]
-
- @description
- Native range input with validation and transformation.
-
- The model for the range input must always be a `Number`.
-
- IE9 and other browsers that do not support the `range` type fall back
- to a text input without any default values for `min`, `max` and `step`. Model binding,
- validation and number parsing are nevertheless supported.
-
- Browsers that support range (latest Chrome, Safari, Firefox, Edge) treat `input[range]`
- in a way that never allows the input to hold an invalid value. That means:
- - any non-numerical value is set to `(max + min) / 2`.
- - any numerical value that is less than the current min val, or greater than the current max val
- is set to the min / max val respectively.
- - additionally, the current `step` is respected, so the nearest value that satisfies a step
- is used.
-
- See the [HTML Spec on input[type=range]](<https://www.w3.org/TR/html5/forms.html#range-state-(type=range)>)
- for more info.
-
- This has the following consequences for AngularTS:
-
- Since the element value should always reflect the current model value, a range input
- will set the bound ngModel expression to the value that the browser has set for the
- input element. For example, in the following input `<input type="range" ng-model="model.value">`,
- if the application sets `model.value = null`, the browser will set the input to `'50'`.
- AngularTS will then set the model to `50`, to prevent input and model value being out of sync.
-
- That means the model for range will immediately be set to `50` after `ngModel` has been
- initialized. It also means a range input can never have the required error.
-
- This does not only affect changes to the model value, but also to the values of the `min`,
- `max`, and `step` attributes. When these change in a way that will cause the browser to modify
- the input value, AngularTS will also update the model value.
-
- Automatic value adjustment also means that a range input element can never have the `required`,
- `min`, or `max` errors.
-
- However, `step` is currently only fully implemented by Firefox. Other browsers have problems
- when the step value changes dynamically - they do not adjust the element value correctly, but
- instead may set the `stepMismatch` error. If that's the case, the AngularTS will set the `step`
- error on the input, and set the model to `undefined`.
-
- Note that `input[range]` is not compatible with`ngMax`, `ngMin`, and `ngStep`, because they do
- not set the `min` and `max` attributes, which means that the browser won't automatically adjust
- the input value based on their values, and will always assume min = 0, max = 100, and step = 1.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} min Sets the `min` validation to ensure that the value entered is greater
-                  than `min`. Can be interpolated.
- @param {string=} max Sets the `max` validation to ensure that the value entered is less than `max`.
-                  Can be interpolated.
- @param {string=} step Sets the `step` validation to ensure that the value entered matches the `step`
-                  Can be interpolated.
- @param {expression=} ngChange AngularTS expression to be executed when the ngModel value changes due
-                      to user interaction with the input element.
- @param {expression=} ngChecked If the expression is truthy, then the `checked` attribute will be set on the
-                      element. **Note** : `ngChecked` should not be used alongside `ngModel`.
-                      Checkout {@link ng.directive:ngChecked ngChecked} for usage.
-
- @example
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

- ## Range Input with ngMin & ngMax attributes

- @example
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

\*/
range: rangeInputType,

/\*\*

- @ngdoc input
- @name input[checkbox]
-
- @description
- HTML checkbox.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {expression=} ngTrueValue The value to which the expression should be set when selected.
- @param {expression=} ngFalseValue The value to which the expression should be set when not selected.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/

/\*\*

- @ngdoc input
- @name input[date]
-
- @description
- Input with date validation and transformation. In browsers that do not yet support
- the HTML5 date input, a text element will be used. In that case, text must be entered in a valid ISO-8601
- date format (yyyy-MM-dd), for example: `2009-01-06`. Since many
- modern browsers do not yet support this input type, it is important to provide cues to users on the
- expected input format via a placeholder or label.
-
- The model must always be a Date object, otherwise AngularTS will throw an error.
- Invalid `Date` objects (dates whose `getTime()` is `NaN`) will be rendered as an empty string.
-
- The timezone to be used to read/write the `Date` instance in the model can be defined using
- {@link ng.directive:ngModelOptions ngModelOptions}. By default, this is the timezone of the browser.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} min Sets the `min` validation error key if the value entered is less than `min`. This must be a
- valid ISO date string (yyyy-MM-dd). You can also use interpolation inside this attribute
- (e.g. `min="{{minDate | date:'yyyy-MM-dd'}}"`). Note that `min` will also add native HTML5
- constraint validation.
- @param {string=} max Sets the `max` validation error key if the value entered is greater than `max`. This must be
- a valid ISO date string (yyyy-MM-dd). You can also use interpolation inside this attribute
- (e.g. `max="{{maxDate | date:'yyyy-MM-dd'}}"`). Note that `max` will also add native HTML5
- constraint validation.
- @param {(date|string)=} ngMin Sets the `min` validation constraint to the Date / ISO date string
- the `ngMin` expression evaluates to. Note that it does not set the `min` attribute.
- @param {(date|string)=} ngMax Sets the `max` validation constraint to the Date / ISO date string
- the `ngMax` expression evaluates to. Note that it does not set the `max` attribute.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- \*/

/\*\*

- @ngdoc directive
- @name textarea
- @restrict E
-
- @description
- HTML textarea element control with AngularTS data-binding. The data-binding and validation
- properties of this element are exactly the same as those of the
- {@link ng.directive:input input element}.
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
- minlength.
- @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
- maxlength. Setting the attribute to a negative or non-numeric value, allows view values of any
- length.
- @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
- does not match a RegExp found by evaluating the AngularTS expression given in the attribute value.
- If the expression evaluates to a RegExp object, then this is used directly.
- If the expression evaluates to a string, then it will be converted to a RegExp
- after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
- `new RegExp('^abc$')`.<br />
- **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
- start at the index of the last search's match, thus not taking the whole input value into
- account.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- @param {boolean=} [ngTrim=true] If set to false AngularTS will not automatically trim the input.
-
- @knownIssue
-
- When specifying the `placeholder` attribute of `<textarea>`, Internet Explorer will temporarily
- insert the placeholder value as the textarea's content. If the placeholder value contains
- interpolation (`{{ ... }}`), an error will be logged in the console when AngularTS tries to update
- the value of the by-then-removed text node. This doesn't affect the functionality of the
- textarea, but can be undesirable.
-
- You can work around this Internet Explorer issue by using `ng-attr-placeholder` instead of
- `placeholder` on textareas, whenever you need interpolation in the placeholder value. You can
- find more details on `ngAttr` in the
- [Interpolation](guide/interpolation#-ngattr-for-binding-to-arbitrary-attributes) section of the
- Developer Guide.
  \*/

/\*\*

- @ngdoc directive
- @name input
- @restrict E
-
- @description
- HTML input element control. When used together with {@link ngModel `ngModel`}, it provides data-binding,
- input state control, and validation.
- Input control follows HTML5 input types and polyfills the HTML5 validation behavior for older browsers.
-
- <div class="alert alert-warning">
- **Note:** Not every feature offered is available for all input types.
- Specifically, data binding and event handling via `ng-model` is unsupported for `input[file]`.
- </div>
-
- @param {string} ngModel Assignable AngularTS expression to data-bind to.
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} required Sets `required` validation error key if the value is not entered.
- @param {boolean=} ngRequired Sets `required` attribute if set to true
- @param {number=} ngMinlength Sets `minlength` validation error key if the value is shorter than
- minlength.
- @param {number=} ngMaxlength Sets `maxlength` validation error key if the value is longer than
- maxlength. Setting the attribute to a negative or non-numeric value, allows view values of any
- length.
- @param {string=} ngPattern Sets `pattern` validation error key if the ngModel {@link ngModel.NgModelController#$viewValue $viewValue}
- value does not match a RegExp found by evaluating the AngularTS expression given in the attribute value.
- If the expression evaluates to a RegExp object, then this is used directly.
- If the expression evaluates to a string, then it will be converted to a RegExp
- after wrapping it in `^` and `$` characters. For instance, `"abc"` will be converted to
- `new RegExp('^abc$')`.<br />
- **Note:** Avoid using the `g` flag on the RegExp, as it will cause each successive search to
- start at the index of the last search's match, thus not taking the whole input value into
- account.
- @param {string=} ngChange AngularTS expression to be executed when input changes due to user
- interaction with the input element.
- @param {boolean=} [ngTrim=true] If set to false AngularTS will not automatically trim the input.
- This parameter is ignored for input[type=password] controls, which will never trim the
- input.
- \*/

/\*\*

- @ngdoc directive
- @name ngValue
- @restrict A
- @priority 100
-
- @description
- Binds the given expression to the value of the element.
-
- It is mainly used on {@link input[radio] `input[radio]`} and option elements,
- so that when the element is selected, the {@link ngModel `ngModel`} of that element (or its
- {@link select `select`} parent element) is set to the bound value. It is especially useful
- for dynamically generated lists using {@link ngRepeat `ngRepeat`}, as shown below.
-
- It can also be used to achieve one-way binding of a given expression to an input element
- such as an `input[text]` or a `textarea`, when that element does not use ngModel.
-
- @element ANY
- @param {string=} ngValue AngularTS expression, whose value will be bound to the `value` attribute
- and `value` property of the element.
- \*/
