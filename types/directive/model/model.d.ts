export function NgModelController($scope: any, $exceptionHandler: any, $attr: any, $element: any, $parse: any, $animate: any, $timeout: any, $q: any, $interpolate: any): void;
export class NgModelController {
    constructor($scope: any, $exceptionHandler: any, $attr: any, $element: any, $parse: any, $animate: any, $timeout: any, $q: any, $interpolate: any);
    $viewValue: number;
    $modelValue: number;
    $$rawModelValue: any;
    $validators: {};
    $asyncValidators: {};
    $parsers: any[];
    $formatters: any[];
    $viewChangeListeners: any[];
    $untouched: boolean;
    $touched: boolean;
    $pristine: boolean;
    $dirty: boolean;
    $valid: boolean;
    $invalid: boolean;
    $error: {};
    $$success: {};
    $pending: any;
    $name: any;
    $$parentForm: {
        $addControl: () => void;
        $getControls: () => any;
        $$renameControl: (control: any, name: any) => void;
        $removeControl: () => void;
        $setValidity: () => void;
        $setDirty: () => void;
        $setPristine: () => void;
        $setSubmitted: () => void;
        $$setSubmitted: () => void;
    };
    $options: any;
    $$updateEvents: string;
    $$updateEventHandler: any;
    $$parsedNgModel: any;
    $$parsedNgModelAssign: any;
    $$ngModelGet: any;
    $$ngModelSet: any;
    $$pendingDebounce: any;
    $$parserValid: boolean;
    $$parserName: string;
    $$currentValidationRunId: number;
    $$scope: any;
    $$rootScope: any;
    $$attr: any;
    $$element: any;
    $$animate: any;
    $$timeout: any;
    $$parse: any;
    $$q: any;
    $$exceptionHandler: any;
    $$initGetterSetters(): void;
    $render: () => void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$isEmpty
     *
     * @description
     * This is called when we need to determine if the value of an input is empty.
     *
     * For instance, the required directive does this to work out if the input has data or not.
     *
     * The default `$isEmpty` function checks whether the value is `undefined`, `''`, `null` or `NaN`.
     *
     * You can override this for input directives whose concept of being empty is different from the
     * default. The `checkboxInputType` directive does this because in its case a value of `false`
     * implies empty.
     *
     * @param {*} value The value of the input to check for emptiness.
     * @returns {boolean} True if `value` is "empty".
     */
    $isEmpty(value: any): boolean;
    $$updateEmptyClasses(value: any): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$setPristine
     *
     * @description
     * Sets the control to its pristine state.
     *
     * This method can be called to remove the `ng-dirty` class and set the control to its pristine
     * state (`ng-pristine` class). A model is considered to be pristine when the control
     * has not been changed from when first compiled.
     */
    $setPristine(): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$setDirty
     *
     * @description
     * Sets the control to its dirty state.
     *
     * This method can be called to remove the `ng-pristine` class and set the control to its dirty
     * state (`ng-dirty` class). A model is considered to be dirty when the control has been changed
     * from when first compiled.
     */
    $setDirty(): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$setUntouched
     *
     * @description
     * Sets the control to its untouched state.
     *
     * This method can be called to remove the `ng-touched` class and set the control to its
     * untouched state (`ng-untouched` class). Upon compilation, a model is set as untouched
     * by default, however this function can be used to restore that state if the model has
     * already been touched by the user.
     */
    $setUntouched(): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$setTouched
     *
     * @description
     * Sets the control to its touched state.
     *
     * This method can be called to remove the `ng-untouched` class and set the control to its
     * touched state (`ng-touched` class). A model is considered to be touched when the user has
     * first focused the control element and then shifted focus away from the control (blur event).
     */
    $setTouched(): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$rollbackViewValue
     *
     * @description
     * Cancel an update and reset the input element's value to prevent an update to the `$modelValue`,
     * which may be caused by a pending debounced event or because the input is waiting for some
     * future event.
     *
     * If you have an input that uses `ng-model-options` to set up debounced updates or updates that
     * depend on special events such as `blur`, there can be a period when the `$viewValue` is out of
     * sync with the ngModel's `$modelValue`.
     *
     * In this case, you can use `$rollbackViewValue()` to manually cancel the debounced / future update
     * and reset the input to the last committed view value.
     *
     * It is also possible that you run into difficulties if you try to update the ngModel's `$modelValue`
     * programmatically before these debounced/future events have resolved/occurred, because AngularJS's
     * dirty checking mechanism is not able to tell whether the model has actually changed or not.
     *
     * The `$rollbackViewValue()` method should be called before programmatically changing the model of an
     * input which may have such events pending. This is important in order to make sure that the
     * input field will be updated with the new model value and any pending operations are cancelled.
     *
     * @example
     * <example name="ng-model-cancel-update" module="cancel-update-example">
     *   <file name="app.js">
     *     angular.module('cancel-update-example', [])
     *
     *     .controller('CancelUpdateController', ['$scope', function($scope) {
     *       $scope.model = {value1: '', value2: ''};
     *
     *       $scope.setEmpty = function(e, value, rollback) {
     *         if (e.keyCode === 27) {
     *           e.preventDefault();
     *           if (rollback) {
     *             $scope.myForm[value].$rollbackViewValue();
     *           }
     *           $scope.model[value] = '';
     *         }
     *       };
     *     }]);
     *   </file>
     *   <file name="index.html">
     *     <div ng-controller="CancelUpdateController">
     *       <p>Both of these inputs are only updated if they are blurred. Hitting escape should
     *       empty them. Follow these steps and observe the difference:</p>
     *       <ol>
     *         <li>Type something in the input. You will see that the model is not yet updated</li>
     *         <li>Press the Escape key.
     *           <ol>
     *             <li> In the first example, nothing happens, because the model is already '', and no
     *             update is detected. If you blur the input, the model will be set to the current view.
     *             </li>
     *             <li> In the second example, the pending update is cancelled, and the input is set back
     *             to the last committed view value (''). Blurring the input does nothing.
     *             </li>
     *           </ol>
     *         </li>
     *       </ol>
     *
     *       <form name="myForm" ng-model-options="{ updateOn: 'blur' }">
     *         <div>
     *           <p id="inputDescription1">Without $rollbackViewValue():</p>
     *           <input name="value1" aria-describedby="inputDescription1" ng-model="model.value1"
     *                  ng-keydown="setEmpty($event, 'value1')">
     *           value1: "{{ model.value1 }}"
     *         </div>
     *
     *         <div>
     *           <p id="inputDescription2">With $rollbackViewValue():</p>
     *           <input name="value2" aria-describedby="inputDescription2" ng-model="model.value2"
     *                  ng-keydown="setEmpty($event, 'value2', true)">
     *           value2: "{{ model.value2 }}"
     *         </div>
     *       </form>
     *     </div>
     *   </file>
         <file name="style.css">
            div {
              display: table-cell;
            }
            div:nth-child(1) {
              padding-right: 30px;
            }
  
          </file>
     * </example>
     */
    $rollbackViewValue(): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$validate
     *
     * @description
     * Runs each of the registered validators (first synchronous validators and then
     * asynchronous validators).
     * If the validity changes to invalid, the model will be set to `undefined`,
     * unless {@link ngModelOptions `ngModelOptions.allowInvalid`} is `true`.
     * If the validity changes to valid, it will set the model to the last available valid
     * `$modelValue`, i.e. either the last parsed value or the last value set from the scope.
     */
    $validate(): void;
    $$runValidators(modelValue: any, viewValue: any, doneCallback: any): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$commitViewValue
     *
     * @description
     * Commit a pending update to the `$modelValue`.
     *
     * Updates may be pending by a debounced event or because the input is waiting for a some future
     * event defined in `ng-model-options`. this method is rarely needed as `NgModelController`
     * usually handles calling this in response to input events.
     */
    $commitViewValue(): void;
    $$lastCommittedViewValue: any;
    $$parseAndValidate(): void;
    $$writeModelToScope(): void;
    /**
     * @ngdoc method
     * @name ngModel.NgModelController#$setViewValue
     *
     * @description
     * Update the view value.
     *
     * This method should be called when a control wants to change the view value; typically,
     * this is done from within a DOM event handler. For example, the {@link ng.directive:input input}
     * directive calls it when the value of the input changes and {@link ng.directive:select select}
     * calls it when an option is selected.
     *
     * When `$setViewValue` is called, the new `value` will be staged for committing through the `$parsers`
     * and `$validators` pipelines. If there are no special {@link ngModelOptions} specified then the staged
     * value is sent directly for processing through the `$parsers` pipeline. After this, the `$validators` and
     * `$asyncValidators` are called and the value is applied to `$modelValue`.
     * Finally, the value is set to the **expression** specified in the `ng-model` attribute and
     * all the registered change listeners, in the `$viewChangeListeners` list are called.
     *
     * In case the {@link ng.directive:ngModelOptions ngModelOptions} directive is used with `updateOn`
     * and the `default` trigger is not listed, all those actions will remain pending until one of the
     * `updateOn` events is triggered on the DOM element.
     * All these actions will be debounced if the {@link ng.directive:ngModelOptions ngModelOptions}
     * directive is used with a custom debounce for this particular event.
     * Note that a `$digest` is only triggered once the `updateOn` events are fired, or if `debounce`
     * is specified, once the timer runs out.
     *
     * When used with standard inputs, the view value will always be a string (which is in some cases
     * parsed into another type, such as a `Date` object for `input[date]`.)
     * However, custom controls might also pass objects to this method. In this case, we should make
     * a copy of the object before passing it to `$setViewValue`. This is because `ngModel` does not
     * perform a deep watch of objects, it only looks for a change of identity. If you only change
     * the property of the object then ngModel will not realize that the object has changed and
     * will not invoke the `$parsers` and `$validators` pipelines. For this reason, you should
     * not change properties of the copy once it has been passed to `$setViewValue`.
     * Otherwise you may cause the model value on the scope to change incorrectly.
     *
     * <div class="alert alert-info">
     * In any case, the value passed to the method should always reflect the current value
     * of the control. For example, if you are calling `$setViewValue` for an input element,
     * you should pass the input DOM value. Otherwise, the control and the scope model become
     * out of sync. It's also important to note that `$setViewValue` does not call `$render` or change
     * the control's DOM value in any way. If we want to change the control's DOM value
     * programmatically, we should update the `ngModel` scope expression. Its new value will be
     * picked up by the model controller, which will run it through the `$formatters`, `$render` it
     * to update the DOM, and finally call `$validate` on it.
     * </div>
     *
     * @param {*} value value from the view.
     * @param {string} trigger Event that triggered the update.
     */
    $setViewValue(value: any, trigger: string): void;
    $$debounceViewValueCommit(trigger: any): void;
    /**
     * @ngdoc method
     *
     * @name ngModel.NgModelController#$overrideModelOptions
     *
     * @description
     *
     * Override the current model options settings programmatically.
     *
     * The previous `ModelOptions` value will not be modified. Instead, a
     * new `ModelOptions` object will inherit from the previous one overriding
     * or inheriting settings that are defined in the given parameter.
     *
     * See {@link ngModelOptions} for information about what options can be specified
     * and how model option inheritance works.
     *
     * <div class="alert alert-warning">
     * **Note:** this function only affects the options set on the `ngModelController`,
     * and not the options on the {@link ngModelOptions} directive from which they might have been
     * obtained initially.
     * </div>
     *
     * <div class="alert alert-danger">
     * **Note:** it is not possible to override the `getterSetter` option.
     * </div>
     *
     * @param {Object} options a hash of settings to override the previous options
     *
     */
    $overrideModelOptions(options: any): void;
    /**
     * @ngdoc method
     *
     * @name  ngModel.NgModelController#$processModelValue
  
     * @description
     *
     * Runs the model -> view pipeline on the current
     * {@link ngModel.NgModelController#$modelValue $modelValue}.
     *
     * The following actions are performed by this method:
     *
     * - the `$modelValue` is run through the {@link ngModel.NgModelController#$formatters $formatters}
     * and the result is set to the {@link ngModel.NgModelController#$viewValue $viewValue}
     * - the `ng-empty` or `ng-not-empty` class is set on the element
     * - if the `$viewValue` has changed:
     *   - {@link ngModel.NgModelController#$render $render} is called on the control
     *   - the {@link ngModel.NgModelController#$validators $validators} are run and
     *   the validation status is set.
     *
     * This method is called by ngModel internally when the bound scope value changes.
     * Application developers usually do not have to call this function themselves.
     *
     * This function can be used when the `$viewValue` or the rendered DOM value are not correctly
     * formatted and the `$modelValue` must be run through the `$formatters` again.
     *
     * @example
     * Consider a text input with an autocomplete list (for fruit), where the items are
     * objects with a name and an id.
     * A user enters `ap` and then selects `Apricot` from the list.
     * Based on this, the autocomplete widget will call `$setViewValue({name: 'Apricot', id: 443})`,
     * but the rendered value will still be `ap`.
     * The widget can then call `ctrl.$processModelValue()` to run the model -> view
     * pipeline again, which formats the object to the string `Apricot`,
     * then updates the `$viewValue`, and finally renders it in the DOM.
     *
     * <example module="inputExample" name="ng-model-process">
       <file name="index.html">
        <div ng-controller="inputController" style="display: flex;">
          <div style="margin-right: 30px;">
            Search Fruit:
            <basic-autocomplete items="items" on-select="selectedFruit = item"></basic-autocomplete>
          </div>
          <div>
            Model:<br>
            <pre>{{selectedFruit | json}}</pre>
          </div>
        </div>
       </file>
       <file name="app.js">
        angular.module('inputExample', [])
          .controller('inputController', function($scope) {
            $scope.items = [
              {name: 'Apricot', id: 443},
              {name: 'Clementine', id: 972},
              {name: 'Durian', id: 169},
              {name: 'Jackfruit', id: 982},
              {name: 'Strawberry', id: 863}
            ];
          })
          .component('basicAutocomplete', {
            bindings: {
              items: '<',
              onSelect: '&'
            },
            templateUrl: 'autocomplete.html',
            controller: function($element, $scope) {
              let that = this;
              let ngModel;
  
              that.$postLink = function() {
                ngModel = $element.find('input').controller('ngModel');
  
                ngModel.$formatters.push(function(value) {
                  return (value && value.name) || value;
                });
  
                ngModel.$parsers.push(function(value) {
                  let match = value;
                  for (let i = 0; i < that.items.length; i++) {
                    if (that.items[i].name === value) {
                      match = that.items[i];
                      break;
                    }
                  }
  
                  return match;
                });
              };
  
              that.selectItem = function(item) {
                ngModel.$setViewValue(item);
                ngModel.$processModelValue();
                that.onSelect({item: item});
              };
            }
          });
       </file>
       <file name="autocomplete.html">
         <div>
           <input type="search" ng-model="$ctrl.searchTerm" />
           <ul>
             <li ng-repeat="item in $ctrl.items | filter:$ctrl.searchTerm">
               <button ng-click="$ctrl.selectItem(item)">{{ item.name }}</button>
             </li>
           </ul>
         </div>
       </file>
     * </example>
     *
     */
    $processModelValue(): void;
    /**
     * This method is called internally to run the $formatters on the $modelValue
     */
    $$format(): number;
    /**
     * This method is called internally when the bound scope value changes.
     */
    $$setModelValue(modelValue: any): void;
    $$setUpdateOnEvents(): void;
}
export namespace NgModelController {
    let $inject: string[];
}
export const ngModelMinErr: (arg0: string, arg1: string, ...arg2: any[]) => Error;
/**
 * @ngdoc directive
 * @name ngModel
 * @restrict A
 * @priority 1
 * @param {string} ngModel assignable {@link guide/expression Expression} to bind to.
 *
 * @description
 * The `ngModel` directive binds an `input`,`select`, `textarea` (or custom form control) to a
 * property on the scope using {@link ngModel.NgModelController NgModelController},
 * which is created and exposed by this directive.
 *
 * `ngModel` is responsible for:
 *
 * - Binding the view into the model, which other directives such as `input`, `textarea` or `select`
 *   require.
 * - Providing validation behavior (i.e. required, number, email, url).
 * - Keeping the state of the control (valid/invalid, dirty/pristine, touched/untouched, validation errors).
 * - Setting related css classes on the element (`ng-valid`, `ng-invalid`, `ng-dirty`, `ng-pristine`, `ng-touched`,
 *   `ng-untouched`, `ng-empty`, `ng-not-empty`) including animations.
 * - Registering the control with its parent {@link ng.directive:form form}.
 *
 * Note: `ngModel` will try to bind to the property given by evaluating the expression on the
 * current scope. If the property doesn't already exist on this scope, it will be created
 * implicitly and added to the scope.
 *
 * For best practices on using `ngModel`, see:
 *
 *  - [Understanding Scopes](https://github.com/angular/angular.js/wiki/Understanding-Scopes)
 *
 * For basic examples, how to use `ngModel`, see:
 *
 *  - {@link ng.directive:input input}
 *    - {@link input[text] text}
 *    - {@link input[checkbox] checkbox}
 *    - {@link input[radio] radio}
 *    - {@link input[number] number}
 *    - {@link input[email] email}
 *    - {@link input[url] url}
 *    - {@link input[date] date}
 *    - {@link input[datetime-local] datetime-local}
 *    - {@link input[time] time}
 *    - {@link input[month] month}
 *    - {@link input[week] week}
 *  - {@link ng.directive:select select}
 *  - {@link ng.directive:textarea textarea}
 *
 * ## Complex Models (objects or collections)
 *
 * By default, `ngModel` watches the model by reference, not value. This is important to know when
 * binding inputs to models that are objects (e.g. `Date`) or collections (e.g. arrays). If only properties of the
 * object or collection change, `ngModel` will not be notified and so the input will not be  re-rendered.
 *
 * The model must be assigned an entirely new object or collection before a re-rendering will occur.
 *
 * Some directives have options that will cause them to use a custom `$watchCollection` on the model expression
 * - for example, `ngOptions` will do so when a `track by` clause is included in the comprehension expression or
 * if the select is given the `multiple` attribute.
 *
 * The `$watchCollection()` method only does a shallow comparison, meaning that changing properties deeper than the
 * first level of the object (or only changing the properties of an item in the collection if it's an array) will still
 * not trigger a re-rendering of the model.
 *
 * ## CSS classes
 * The following CSS classes are added and removed on the associated input/select/textarea element
 * depending on the validity of the model.
 *
 *  - `ng-valid`: the model is valid
 *  - `ng-invalid`: the model is invalid
 *  - `ng-valid-[key]`: for each valid key added by `$setValidity`
 *  - `ng-invalid-[key]`: for each invalid key added by `$setValidity`
 *  - `ng-pristine`: the control hasn't been interacted with yet
 *  - `ng-dirty`: the control has been interacted with
 *  - `ng-touched`: the control has been blurred
 *  - `ng-untouched`: the control hasn't been blurred
 *  - `ng-pending`: any `$asyncValidators` are unfulfilled
 *  - `ng-empty`: the view does not contain a value or the value is deemed "empty", as defined
 *     by the {@link ngModel.NgModelController#$isEmpty} method
 *  - `ng-not-empty`: the view contains a non-empty value
 *
 * Keep in mind that ngAnimate can detect each of these classes when added and removed.
 *
 * @animations
 * Animations within models are triggered when any of the associated CSS classes are added and removed
 * on the input element which is attached to the model. These classes include: `.ng-pristine`, `.ng-dirty`,
 * `.ng-invalid` and `.ng-valid` as well as any other validations that are performed on the model itself.
 * The animations that are triggered within ngModel are similar to how they work in ngClass and
 * animations can be hooked into using CSS transitions, keyframes as well as JS animations.
 *
 * The following example shows a simple way to utilize CSS transitions to style an input element
 * that has been rendered as invalid after it has been validated:
 *
 * <pre>
 * //be sure to include ngAnimate as a module to hook into more
 * //advanced animations
 * .my-input {
 *   transition:0.5s linear all;
 *   background: white;
 * }
 * .my-input.ng-invalid {
 *   background: red;
 *   color:white;
 * }
 * </pre>
 *
 * @example
 * ### Basic Usage
 * <example deps="angular-animate.js" animations="true" fixBase="true" module="inputExample" name="ng-model">
     <file name="index.html">
       <script>
        angular.module('inputExample', [])
          .controller('ExampleController', ['$scope', function($scope) {
            $scope.val = '1';
          }]);
       </script>
       <style>
         .my-input {
           transition:all linear 0.5s;
           background: transparent;
         }
         .my-input.ng-invalid {
           color:white;
           background: red;
         }
       </style>
       <p id="inputDescription">
        Update input to see transitions when valid/invalid.
        Integer is a valid value.
       </p>
       <form name="testForm" ng-controller="ExampleController">
         <input ng-model="val" ng-pattern="/^\d+$/" name="anim" class="my-input"
                aria-describedby="inputDescription" />
       </form>
     </file>
 * </example>
 *
 * @example
 * ### Binding to a getter/setter
 *
 * Sometimes it's helpful to bind `ngModel` to a getter/setter function.  A getter/setter is a
 * function that returns a representation of the model when called with zero arguments, and sets
 * the internal state of a model when called with an argument. It's sometimes useful to use this
 * for models that have an internal representation that's different from what the model exposes
 * to the view.
 *
 * <div class="alert alert-success">
 * **Best Practice:** It's best to keep getters fast because AngularJS is likely to call them more
 * frequently than other parts of your code.
 * </div>
 *
 * You use this behavior by adding `ng-model-options="{ getterSetter: true }"` to an element that
 * has `ng-model` attached to it. You can also add `ng-model-options="{ getterSetter: true }"` to
 * a `<form>`, which will enable this behavior for all `<input>`s within it. See
 * {@link ng.directive:ngModelOptions `ngModelOptions`} for more.
 *
 * The following example shows how to use `ngModel` with a getter/setter:
 *
 * @example
 * <example name="ngModel-getter-setter" module="getterSetterExample">
     <file name="index.html">
       <div ng-controller="ExampleController">
         <form name="userForm">
           <label>Name:
             <input type="text" name="userName"
                    ng-model="user.name"
                    ng-model-options="{ getterSetter: true }" />
           </label>
         </form>
         <pre>user.name = <span ng-bind="user.name()"></span></pre>
       </div>
     </file>
     <file name="app.js">
       angular.module('getterSetterExample', [])
         .controller('ExampleController', ['$scope', function($scope) {
           let _name = 'Brian';
           $scope.user = {
             name: function(newName) {
              // Note that newName can be undefined for two reasons:
              // 1. Because it is called as a getter and thus called with no arguments
              // 2. Because the property should actually be set to undefined. This happens e.g. if the
              //    input is invalid
              return arguments.length ? (_name = newName) : _name;
             }
           };
         }]);
     </file>
 * </example>
 */
export const ngModelDirective: (string | (($rootScope: any) => {
    restrict: string;
    require: string[];
    controller: typeof NgModelController;
    priority: number;
    compile: (element: any) => {
        pre: (scope: any, element: any, attr: any, ctrls: any) => void;
        post: (scope: any, element: any, attr: any, ctrls: any) => void;
    };
}))[];
