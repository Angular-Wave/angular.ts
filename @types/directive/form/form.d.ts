export function setupValidity(instance: any): void;
/**
 * @type {{
 *   $nonscope: boolean,
 *   $addControl: Function,
 *   $getControls: () => any[],
 *   $$renameControl: Function,
 *   $removeControl: Function,
 *   $setValidity: Function | ((key: any, isValid: boolean, control: any) => any),
 *   $setDirty: Function,
 *   $setPristine: Function,
 *   $setSubmitted: Function,
 *   $$setSubmitted: Function
 * }}
 */
export const nullFormCtrl: {
    $nonscope: boolean;
    $addControl: Function;
    $getControls: () => any[];
    $$renameControl: Function;
    $removeControl: Function;
    $setValidity: Function | ((key: any, isValid: boolean, control: any) => any);
    $setDirty: Function;
    $setPristine: Function;
    $setSubmitted: Function;
    $$setSubmitted: Function;
};
export const PENDING_CLASS: "ng-pending";
/**
 * @property {boolean} $dirty True if user has already interacted with the form.
 * @property {boolean} $valid True if all of the containing forms and controls are valid.
 * @property {boolean} $invalid True if at least one containing control or form is invalid.
 * @property {boolean} $submitted True if user has submitted the form even if its invalid.
 *
 * @property {Object} $pending An object hash, containing references to controls or forms with
 *  pending validators, where:
 *
 *  - keys are validations tokens (error names).
 *  - values are arrays of controls or forms that have a pending validator for the given error name.
 *
 * See {@link form.FormController#$error $error} for a list of built-in validation tokens.
 *
 * @property {Object} $error An object hash, containing references to controls or forms with failing
 *  validators, where:
 *
 *  - keys are validation tokens (error names),
 *  - values are arrays of controls or forms that have a failing validator for the given error name.
 *
 *  Built-in validation tokens:
 *  - `email`
 *  - `max`
 *  - `maxlength`
 *  - `min`
 *  - `minlength`
 *  - `number`
 *  - `pattern`
 *  - `required`
 *  - `url`
 *  - `date`
 *  - `datetimelocal`
 *  - `time`
 *  - `week`
 *  - `month`
 *
 * @description
 * `FormController` keeps track of all its controls and nested forms as well as the state of them,
 * such as being valid/invalid or dirty/pristine.
 *
 * Each {@link ng.directive:form form} directive creates an instance
 * of `FormController`.
 *
 */
export class FormController {
    static $nonscope: boolean;
    static $inject: string[];
    /**
     * @param {Element} $element
     * @param {import("../../core/compile/attributes.js").Attributes} $attrs
     * @param {import("../../core/scope/scope.js").Scope} $scope
     * @param {*} $animate
     * @param {*} $interpolate
     */
    constructor($element: Element, $attrs: import("../../core/compile/attributes.js").Attributes, $scope: import("../../core/scope/scope.js").Scope, $animate: any, $interpolate: any);
    $$controls: any[];
    $name: any;
    /**
     * @property {boolean} $dirty True if user has already interacted with the form.
     */
    $dirty: boolean;
    /**
     * @propertys {boolean} $pristine - True if user has not interacted with the form yet.s
     */
    $pristine: boolean;
    $valid: boolean;
    $invalid: boolean;
    $submitted: boolean;
    /** @type {FormController|Object} */
    $$parentForm: FormController | any;
    $$element: Element;
    $$animate: any;
    $error: {};
    $$success: {};
    $pending: any;
    $$classCache: {};
    /**
     * Rollback all form controls pending updates to the `$modelValue`.
     *
     * Updates may be pending by a debounced event or because the input is waiting for a some future
     * event defined in `ng-model-options`. This method is typically needed by the reset button of
     * a form that uses `ng-model-options` to pend updates.
     */
    $rollbackViewValue(): void;
    /**
     * Commit all form controls pending updates to the `$modelValue`.
     *
     * Updates may be pending by a debounced event or because the input is waiting for a some future
     * event defined in `ng-model-options`. This method is rarely needed as `NgModelController`
     * usually handles calling this in response to input events.
     */
    $commitViewValue(): void;
    /**
     * Register a control with the form. Input elements using ngModelController do this automatically
     * when they are linked.
     *
     * Note that the current state of the control will not be reflected on the new parent form. This
     * is not an issue with normal use, as freshly compiled and linked controls are in a `$pristine`
     * state.
     *
     * However, if the method is used programmatically, for example by adding dynamically created controls,
     * or controls that have been previously removed without destroying their corresponding DOM element,
     * it's the developers responsibility to make sure the current state propagates to the parent form.
     *
     * For example, if an input control is added that is already `$dirty` and has `$error` properties,
     * calling `$setDirty()` and `$validate()` afterwards will propagate the state to the parent form.
     */
    $addControl(control: any): void;
    /**
     * This method returns a **shallow copy** of the controls that are currently part of this form.
     * The controls can be instances of {@link form.FormController `FormController`}
     * ({@link ngForm "child-forms"}) and of {@link ngModel.NgModelController `NgModelController`}.
     * If you need access to the controls of child-forms, you have to call `$getControls()`
     * recursively on them.
     * This can be used for example to iterate over all controls to validate them.
     *
     * The controls can be accessed normally, but adding to, or removing controls from the array has
     * no effect on the form. Instead, use {@link form.FormController#$addControl `$addControl()`} and
     * {@link form.FormController#$removeControl `$removeControl()`} for this use-case.
     * Likewise, adding a control to, or removing a control from the form is not reflected
     * in the shallow copy. That means you should get a fresh copy from `$getControls()` every time
     * you need access to the controls.
     */
    $getControls(): any;
    $$renameControl(control: any, newName: any): void;
    /**
     * Deregister a control from the form.
     *
     * Input elements using ngModelController do this automatically when they are destroyed.
     *
     * Note that only the removed control's validation state (`$errors`etc.) will be removed from the
     * form. `$dirty`, `$submitted` states will not be changed, because the expected behavior can be
     * different from case to case. For example, removing the only `$dirty` control from a form may or
     * may not mean that the form is still `$dirty`.
     */
    $removeControl(control: any): void;
    /**
     * Sets the form to a dirty state.
     *
     * This method can be called to add the 'ng-dirty' class and set the form to a dirty
     * state (ng-dirty class). This method will also propagate to parent forms.
     */
    $setDirty(): void;
    /**
     * Sets the form to its pristine state.
     *
     * This method sets the form's `$pristine` state to true, the `$dirty` state to false, removes
     * the `ng-dirty` class and adds the `ng-pristine` class. Additionally, it sets the `$submitted`
     * state to false.
     *
     * This method will also propagate to all the controls contained in this form.
     *
     * Setting a form back to a pristine state is often useful when we want to 'reuse' a form after
     * saving or resetting it.
     */
    $setPristine(): void;
    /**
     * Sets the form to its untouched state.
     *
     * This method can be called to remove the 'ng-touched' class and set the form controls to their
     * untouched state (ng-untouched class).
     *
     * Setting a form controls back to their untouched state is often useful when setting the form
     * back to its pristine state.
     */
    $setUntouched(): void;
    /**
     * Sets the form to its `$submitted` state. This will also set `$submitted` on all child and
     * parent forms of the form.
     */
    $setSubmitted(): void;
    $$setSubmitted(): void;
    set(object: any, property: any, controller: any): void;
    unset(object: any, property: any, controller: any): void;
    /**
     * Change the validity state of the form, and notify the parent form (if any).
     *
     * Application developers will rarely need to call this method directly. It is used internally, by
     * {@link ngModel.NgModelController#$setValidity NgModelController.$setValidity()}, to propagate a
     * control's validity state to the parent `FormController`.
     *
     * @param {string} validationErrorKey Name of the validator. The `validationErrorKey` will be
     *        assigned to either `$error[validationErrorKey]` or `$pending[validationErrorKey]` (for
     *        unfulfilled `$asyncValidators`), so that it is available for data-binding. The
     *        `validationErrorKey` should be in camelCase and will get converted into dash-case for
     *        class name. Example: `myError` will result in `ng-valid-my-error` and
     *        `ng-invalid-my-error` classes and can be bound to as `{{ someForm.$error.myError }}`.
     * @param {boolean} state Whether the current state is valid (true), invalid (false), pending
     *        (undefined),  or skipped (null). Pending is used for unfulfilled `$asyncValidators`.
     *        Skipped is used by AngularJS when validators do not run because of parse errors and when
     *        `$asyncValidators` do not run because any of the `$validators` failed.
     * @param {import("../model/model.js").NgModelController | FormController} controller - The controller whose validity state is
     *        triggering the change.
     */
    $setValidity(validationErrorKey: string, state: boolean, controller: import("../model/model.js").NgModelController | FormController): void;
}
export const formDirective: (string | (($parse: any) => {
    name: string;
    restrict: string;
    require: string[];
    controller: typeof FormController;
    compile: (formElement: any, attr: any) => {
        pre: (scope: any, formElement: any, attr: any, ctrls: any) => void;
    };
}))[];
export const ngFormDirective: (string | (($parse: any) => {
    name: string;
    restrict: string;
    require: string[];
    controller: typeof FormController;
    compile: (formElement: any, attr: any) => {
        pre: (scope: any, formElement: any, attr: any, ctrls: any) => void;
    };
}))[];
