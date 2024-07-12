/**
 * @typedef {Object} angular.BootstrapConfig
 * @description Configuration option for AngularTS bootstrap process.
 * @property {boolean} debugInfoEnabled - Indicates whether debug information should be enabled. Setting this to `false` can improve performance but will disable some debugging features.
 * @property {boolean} [strictDi] - Disable automatic function annotation for the application. This is meant to assist in finding bugs which break minified code. Defaults to `false`.
 */
/**
 * @typedef {Function|Array<string|Function>} angular.Injectable
 * @description Represents a type that can be injected, either as a function or an array of strings/functions.
 * @template T
 */
/**
 * @typedef {Object} angular.ComponentOptions
 * @description Component definition object (a simplified directive definition object)
 * @property {string | angular.angular.Injectable<angular.ControllerConstructor>> | undefined} [controller]
 *   Controller constructor function or name of a registered controller.
 *   Use array form for dependencies (necessary with strictDi).
 * @property {string | undefined} [controllerAs]
 *   Identifier name for the controller published to its scope (default: '$ctrl').
 * @property {string | angular.angular.Injectable<(...args: any[]) => string> | undefined} [template]
 *   HTML template string or function returning an HTML template.
 *   If a function, injects $element and $attrs.
 *   Use array form for dependencies (necessary with strictDi).
 * @property {string | angular.angular.Injectable<(...args: any[]) => string> | undefined} [templateUrl]
 *   Path or function returning a path to an HTML template.
 *   If a function, injects $element and $attrs.
 *   Use array form for dependencies (necessary with strictDi).
 * @property {{ [boundProperty: string]: string } | undefined} [bindings]
 *   DOM attribute bindings to component properties.
 *   Component properties are bound to the controller, not the scope.
 * @property {boolean | { [slot: string]: string } | undefined} [transclude]
 *   Whether transclusion is enabled. Disabled by default.
 * @property {{ [controller: string]: string } | undefined} [require]
 *   Requires controllers of other directives, binding them to this component's controller.
 *   Keys specify property names under which required controllers (object values) are bound.
 *   Required controllers available before $onInit method execution.
 */
/**
 * @typedef {Function} angular.ControllerConstructor
 * @description Controller constructor type for AngularJS. Note: Instead of classes, plain functions are often used as controller constructors, especially in examples.
 * @param {...any} args Arguments passed to the controller constructor.
 * @returns {void | angular.Controller} Returns nothing or an instance of IController.
 */
/**
 * @typedef {Object} angular.OnChangesObject
 * @description Object representing changes in one-way bound properties.
 * Keys are the names of the bound properties that have changed, and values are instances of IChangesObject.
 * @property {angular.ChangesObject<any>} property - Represents a changed property.
 */
/**
 * @typedef {Object} angular.ChangesObject
 * @description Object representing changes in a property.
 * @property {*} currentValue - Current value of the property.
 * @property {*} previousValue - Previous value of the property.
 * @property {function(): boolean} isFirstChange - Function to check if it's the first change of the property.
 */
/**
 * @typedef {Object} angular.Controller
 * @description Interface representing the lifecycle hooks for AngularJS directive controllers.
 * @see {@link https://docs.angularjs.org/api/ng/service/$compile#life-cycle-hooks}
 * @see {@link https://docs.angularjs.org/guide/component}
 *
 * @property {function(): void} [$onInit]
 * Called on each controller after all the controllers on an element have been constructed and had their bindings
 * initialized (and before the pre & post linking functions for the directives on this element). This is a good
 * place to put initialization code for your controller.
 *
 * @property {function(): void} [$doCheck]
 * Called on each turn of the digest cycle. Provides an opportunity to detect and act on changes.
 * Any actions that you wish to take in response to the changes that you detect must be invoked from this hook;
 * implementing this has no effect on when `$onChanges` is called. For example, this hook could be useful if you wish
 * to perform a deep equality check, or to check a `Date` object, changes to which would not be detected by Angular's
 * change detector and thus not trigger `$onChanges`. This hook is invoked with no arguments; if detecting changes,
 * you must store the previous value(s) for comparison to the current values.
 *
 * @property {function(angular.OnChangesObject): void} [$onChanges]
 * Called whenever one-way bindings are updated. The onChangesObj is a hash whose keys are the names of the bound
 * properties that have changed, and the values are an {@link IChangesObject} object  of the form
 * { currentValue, previousValue, isFirstChange() }. Use this hook to trigger updates within a component such as
 * cloning the bound value to prevent accidental mutation of the outer value.
 *
 * @property {function(): void} [$onDestroy]
 * Called on a controller when its containing scope is destroyed. Use this hook for releasing external resources,
 * watches and event handlers.
 *
 * @property {function(): void} [$postLink]
 * Called after this controller's element and its children have been linked. Similar to the post-link function this
 * hook can be used to set up DOM event handlers and do direct DOM manipulation. Note that child elements that contain
 * templateUrl directives will not have been compiled and linked since they are waiting for their template to load
 * asynchronously and their own compilation and linking has been suspended until that occurs. This hook can be considered
 * analogous to the ngAfterViewInit and ngAfterContentInit hooks in Angular 2. Since the compilation process is rather
 * different in Angular 1 there is no direct mapping and care should be taken when upgrading.
 *
 * @property {*} [s: string]
 * IController implementations frequently do not implement any of its methods.
 * A string indexer indicates to TypeScript not to issue a weak type error in this case.
 */
/**
 * @typedef {Object.<string, any>} angular.Attributes
 *
 * @property {(name: string) => string} $normalize
 * Converts an attribute name (e.g. dash/colon/underscore-delimited string, optionally prefixed with x- or data-) to its normalized, camelCase form.
 * Also there is special case for Moz prefix starting with upper case letter.
 *
 * @property {(newClasses: string, oldClasses: string) => void} $updateClass
 * Adds and removes the appropriate CSS class values to the element based on the difference between
 * the new and old CSS class values (specified as newClasses and oldClasses).
 *
 * @property {(key: string, value: any) => void} $set
 * Set DOM element attribute value.
 *
 * @property {<T>(name: string, fn: (value?: T) => any) => Function} $observe
 * Observes an interpolated attribute.
 * The observer function will be invoked once during the next $digest
 * following compilation. The observer is then invoked whenever the
 * interpolated value changes.
 *
 * @property {Object.<string, string>} $attr
 * A map of DOM element attribute names to the normalized name. This is needed
 * to do reverse lookup from normalized name back to actual name.
 * @see http://docs.angularjs.org/api/ng/type/$compile.directive.Attributes
 */
/**
 * @typedef {import('./core/scope/scope').Scope} TScope
 */
/**
 * @typedef {import('./shared/jqlite/jqlite').JQLite} TElement
 */
/**
 * @typedef {angular.Attributes} TAttributes
 */
/**
 * @typedef {angular.DirectiveController} TController
 */
/**
 * @typedef {angular.Controller | angular.Controller[] | { [key: string]: angular.Controller }} angular.DirectiveController
 * @description Represents a directive controller, which can be:
 * - A single instance of {@link angular.Controller}
 * - An array of {@link angular.Controller}
 * - An object where keys are string identifiers and values are {@link angular.Controller}
 */
/**
 * @template [S=import('./core/scope/scope').Scope]
 * @template {TScope} S - The type of the directive's scope.
 *
 * @template [T=import('./shared/jqlite/jqlite').JQLite]
 * @template {TElement} T - The type of the directive's element.
 *
 * @template [A=angular.Attributes]
 * @template {TAttributes} A - The type of the directive's attributes.
 *
 * @template [C=angular.Controller]
 * @template {TController} C - The type of the directive's controller.
 */
/**
 * Compile function for an AngularJS directive.
 *
 * @template TScope
 * @template TElement
 * @template TAttributes
 * @template TController
 * @callback angular.DirectiveCompileFn
 * @param {TElement} templateElement - The template element.
 * @param {TAttributes} templateAttributes - The template attributes.
 * @param {angular.TranscludeFunction} transclude - @deprecated The transclude function. Note: The transclude function that is passed to the compile function is deprecated,
 * as it e.g. does not know about the right outer scope. Please use the transclude function
 * that is passed to the link function instead.
 * @returns {void | angular.DirectiveLinkFn<S, T, A, C> | angular.DirectivePrePost<S, T, A, C>} Returns void, angular.DirectiveLinkFn, or  angular.DirectivePrePost.
 */
/**
 * Link function for an AngularJS directive.
 *
 * @template TScope
 * @template TElement
 * @template TAttributes
 * @template TController
 * @callback angular.DirectiveLinkFn
 * @param {TScope} scope
 * @param {TElement} instanceElement
 * @param {TAttributes} instanceAttributes
 * @param {TController} [controller]
 * @param {angular.TranscludeFunction} [transclude]
 * @returns {void}
 */
/**
 * @callback angular.CloneAttachFunction
 * @param {JQLite} [clonedElement]
 * @param {Scope} [scope] // Let's hint but not force cloneAttachFn's signature
 * @returns {any}
 */
/**
 * This corresponds to $transclude passed to controllers and to the transclude function passed to link functions.
 * https://docs.angularjs.org/api/ng/service/$compile#-controller-
 * http://teropa.info/blog/2015/06/09/transclusion.html
 *
 * @typedef {Object} angular.TranscludeFunction
 * @property {function(TScope, angular.CloneAttachFunction, JQLite=, string=): JQLite} transcludeWithScope
 * @property {function(angular.CloneAttachFunction=, JQLite=, string=): JQLite} transcludeWithoutScope
 * @property {function(string): boolean} isSlotFilled - Returns true if the specified slot contains content (i.e., one or more DOM nodes)
 */
/**
 * @typedef {function(TScope, angular.CloneAttachFunction, JQLite=, string=): JQLite} transcludeWithScope
 */
/**
 * @typedef {function(angular.CloneAttachFunction=, JQLite=, string=): JQLite} transcludeWithoutScope
 */
/**
 * Represents the pre and post linking functions of a directive.
 *
 * @template TScope The type of scope associated with the directive.
 * @template TElement The type of element that the directive matches.
 * @template TAttributes The type of attributes of the directive.
 * @template TController The type of controller associated with the directive.
 *
 * @typedef {Object} angular.DirectivePrePost
 * @property {angular.DirectiveLinkFn<S, T, A, C> | undefined} [pre]
 *   The pre-linking function of the directive.
 * @property {angular.DirectiveLinkFn<S, T, A, C> | undefined} [post]
 *   The post-linking function of the directive.
 */
/**
 * Directive definition object.
 *
 * @template TScope - The type of the directive's scope.
 * @template TElement - The type of the directive's element.
 * @template TAttributes - The type of the directive's attributes.
 * @template TController - The type of the directive's controller.
 *
 * @typedef {Object} angular.Directive
 * @property {angular.DirectiveCompileFn<S, T, A, C> | undefined} [compile]
 * Compile function for the directive.
 * @property {string | angular.Injectable<angular.ControllerConstructor> | undefined} [controller]
 * Controller constructor or name.
 * @property {string | undefined} [controllerAs]
 * Controller alias.
 * @property {boolean | { [boundProperty: string]: string } | undefined} [bindToController]
 * Bindings to controller.
 * @property {angular.DirectiveLinkFn<S, T, A, C> |  angular.DirectivePrePost<S, T, A, C> | undefined} [link]
 * Link function.
 * @property {boolean | undefined} [multiElement]
 * Multi-element directive flag.
 * @property {number | undefined} [priority]
 * Directive priority.
 * @property {boolean | undefined} [replace]
 * Deprecated: Replace flag.
 * @property {string | string[] | { [controller: string]: string } | undefined} [require]
 * Required controllers.
 * @property {string | undefined} [restrict]
 * Restriction mode.
 * @property {boolean | { [boundProperty: string]: string } | undefined} [scope]
 * Scope options.
 * @property {string | ((tElement: TElement, tAttrs: TAttributes) => string) | undefined} [template]
 * HTML template.
 * @property {string | undefined} [templateNamespace]
 * Template namespace.
 * @property {string | ((tElement: TElement, tAttrs: TAttributes) => string) | undefined} [templateUrl]
 * HTML template URL.
 * @property {boolean | "element" | { [slot: string]: string } | undefined} [transclude]
 * Transclusion options.
 */
/**
 * Factory function for creating directives.
 *
 * @template TScope - The type of the directive's scope.
 * @template TElement - The type of the directive's element.
 * @template TAttributes - The type of the directive's attributes.
 * @template TController - The type of the directive's controller.
 *
 * @typedef {(...args: any[]) => angular.Directive<S, T, A, C> | angular.DirectiveLinkFn<S, T, A, C>} angular.DirectiveFactory
 */
/**
 * @typedef {Function} angular.FilterFunction
 * @property {boolean|undefined} [$stateful] By default, filters are only run once the input value changes. By marking the filter as `$stateful`, the filter will be run on every `$digest` to update the output. **This is strongly discouraged.** See https://docs.angularjs.org/guide/filter#stateful-filters
 */
/**
 * @typedef {Function} angular.FilterFactory
 * @returns {angular.FilterFunction}
 */
/**
 * Interface for a service provider class.
 * @typedef {Object} angular.ServiceProviderClass
 * @property {Function} constructor - The constructor for the service provider.
 * @param {...any} args - The arguments for the constructor.
 * @returns {angular.ServiceProvider}
 */
/**
 * Interface for a service provider factory function.
 * @typedef {Function} angular.ServiceProviderFactory
 * @param {...any} args - The arguments for the factory function.
 * @returns {angular.ServiceProvider}
 */
/**
 * Interface for a service provider.
 * @typedef {Object} angular.ServiceProvider
 * @property {*} $get - The $get property that represents a service instance or a factory function.
 */
/** @type {angular.ServiceProvider} */
export const ServiceProvider: angular.ServiceProvider;
export namespace angular {
    type BootstrapConfig = any;
    type Injectable<T_1> = Function | Array<string | Function>;
    type ComponentOptions = any;
    type ControllerConstructor = Function;
    type OnChangesObject = any;
    type ChangesObject = any;
    type Controller = any;
    type Attributes = {
        [x: string]: any;
    };
    type DirectiveController = angular.Controller | angular.Controller[] | {
        [key: string]: angular.Controller;
    };
    /**
     * Compile function for an AngularJS directive.
     */
    type DirectiveCompileFn<TScope, TElement, TAttributes, TController> = (templateElement: TElement, templateAttributes: TAttributes, transclude: angular.TranscludeFunction) => any;
    /**
     * Link function for an AngularJS directive.
     */
    type DirectiveLinkFn<TScope, TElement, TAttributes, TController> = (scope: TScope, instanceElement: TElement, instanceAttributes: TAttributes, controller?: TController, transclude?: angular.TranscludeFunction) => void;
    type CloneAttachFunction = (clonedElement?: JQLite, scope?: Scope) => any;
    /**
     * This corresponds to $transclude passed to controllers and to the transclude function passed to link functions.
     * https://docs.angularjs.org/api/ng/service/$compile#-controller-
     * http://teropa.info/blog/2015/06/09/transclusion.html
     */
    type TranscludeFunction = {
        transcludeWithScope: (arg0: TScope, arg1: angular.CloneAttachFunction, arg2: JQLite | undefined, arg3: string | undefined) => JQLite;
        transcludeWithoutScope: (arg0: angular.CloneAttachFunction | undefined, arg1: JQLite | undefined, arg2: string | undefined) => JQLite;
        /**
         * - Returns true if the specified slot contains content (i.e., one or more DOM nodes)
         */
        isSlotFilled: (arg0: string) => boolean;
    };
    /**
     * Represents the pre and post linking functions of a directive.
     */
    type DirectivePrePost<TScope, TElement, TAttributes, TController> = {
        /**
         * The pre-linking function of the directive.
         */
        pre?: angular.DirectiveLinkFn<S, T, A, C> | undefined;
        /**
         * The post-linking function of the directive.
         */
        post?: angular.DirectiveLinkFn<S, T, A, C> | undefined;
    };
    /**
     * Directive definition object.
     */
    type Directive<TScope, TElement, TAttributes, TController> = {
        /**
         * Compile function for the directive.
         */
        compile?: angular.DirectiveCompileFn<S, T, A, C> | undefined;
        /**
         * Controller constructor or name.
         */
        controller?: string | angular.Injectable<angular.ControllerConstructor> | undefined;
        /**
         * Controller alias.
         */
        controllerAs?: string | undefined;
        /**
         * Bindings to controller.
         */
        bindToController?: boolean | {
            [boundProperty: string]: string;
        } | undefined;
        /**
         * Link function.
         */
        link?: angular.DirectiveLinkFn<S, T, A, C> | angular.DirectivePrePost<S, T, A, C> | undefined;
        /**
         * Multi-element directive flag.
         */
        multiElement?: boolean | undefined;
        /**
         * Directive priority.
         */
        priority?: number | undefined;
        /**
         * Deprecated: Replace flag.
         */
        replace?: boolean | undefined;
        /**
         * Required controllers.
         */
        require?: string | string[] | {
            [controller: string]: string;
        } | undefined;
        /**
         * Restriction mode.
         */
        restrict?: string | undefined;
        /**
         * Scope options.
         */
        scope?: boolean | {
            [boundProperty: string]: string;
        } | undefined;
        /**
         * HTML template.
         */
        template?: string | ((tElement: TElement, tAttrs: TAttributes) => string) | undefined;
        /**
         * Template namespace.
         */
        templateNamespace?: string | undefined;
        /**
         * HTML template URL.
         */
        templateUrl?: string | ((tElement: TElement, tAttrs: TAttributes) => string) | undefined;
        /**
         * Transclusion options.
         */
        transclude?: boolean | "element" | {
            [slot: string]: string;
        } | undefined;
    };
    /**
     * Factory function for creating directives.
     */
    type DirectiveFactory<TScope, TElement, TAttributes, TController> = (...args: any[]) => angular.Directive<S, T, A, C> | angular.DirectiveLinkFn<S, T, A, C>;
    type FilterFunction = Function;
    type FilterFactory = Function;
    /**
     * Interface for a service provider class.
     */
    type ServiceProviderClass = {
        /**
         * - The constructor for the service provider.
         */
        constructor: Function;
    };
    /**
     * Interface for a service provider factory function.
     */
    type ServiceProviderFactory = Function;
    /**
     * Interface for a service provider.
     */
    type ServiceProvider = {
        /**
         * - The $get property that represents a service instance or a factory function.
         */
        $get: any;
    };
    type Module = any;
    type FormController = {
        /**
         * - True if the form has not been modified.
         */
        $pristine: boolean;
        /**
         * - True if the form has been modified.
         */
        $dirty: boolean;
        /**
         * - True if the form is valid.
         */
        $valid: boolean;
        /**
         * - True if the form is invalid.
         */
        $invalid: boolean;
        /**
         * - True if the form has been submitted.
         */
        $submitted: boolean;
        /**
         * - An object containing arrays of controls with validation errors keyed by validation error keys.
         */
        $error: {
            [x: string]: Array<angular.NgModelController | angular.FormController>;
        };
        /**
         * - The name of the form.
         */
        $name?: string | undefined;
        /**
         * - An object containing arrays of controls that are pending validation, keyed by validation error keys.
         */
        $pending?: {
            [x: string]: Array<angular.NgModelController | angular.FormController>;
        } | undefined;
        /**
         * - Adds a control to the form.
         */
        $addControl: (arg0: angular.NgModelController | angular.FormController) => void;
        /**
         * - Returns an array of all controls in the form.
         */
        $getControls: () => ReadonlyArray<angular.NgModelController | angular.FormController>;
        /**
         * - Removes a control from the form.
         */
        $removeControl: (arg0: angular.NgModelController | angular.FormController) => void;
        /**
         * - Sets the validity of a control in the form.
         */
        $setValidity: (arg0: string, arg1: boolean, arg2: angular.NgModelController | angular.FormController) => void;
        /**
         * - Marks the form as dirty.
         */
        $setDirty: () => void;
        /**
         * - Marks the form as pristine.
         */
        $setPristine: () => void;
        /**
         * - Commits the view value of all controls in the form.
         */
        $commitViewValue: () => void;
        /**
         * - Rolls back the view value of all controls in the form.
         */
        $rollbackViewValue: () => void;
        /**
         * - Marks the form as submitted.
         */
        $setSubmitted: () => void;
        /**
         * - Marks the form controls as untouched.
         */
        $setUntouched: () => void;
        /**
         * - An indexer for additional properties.
         */
        name?: (arg0: string) => any;
    };
    type NgModelController = {
        /**
         * - Renders the view value.
         */
        $render: () => void;
        /**
         * - Sets the validity state.
         */
        $setValidity: (arg0: string, arg1: boolean) => void;
        /**
         * - Sets the view value.
         */
        $setViewValue: (arg0: any, arg1: string | undefined) => void;
        /**
         * - Marks the control as pristine.
         */
        $setPristine: () => void;
        /**
         * - Marks the control as dirty.
         */
        $setDirty: () => void;
        /**
         * - Validates the control.
         */
        $validate: () => void;
        /**
         * - Marks the control as touched.
         */
        $setTouched: () => void;
        /**
         * - Marks the control as untouched.
         */
        $setUntouched: () => void;
        /**
         * - Rolls back the view value.
         */
        $rollbackViewValue: () => void;
        /**
         * - Commits the view value.
         */
        $commitViewValue: () => void;
        /**
         * - Processes the model value.
         */
        $processModelValue: () => void;
        /**
         * - Checks if the value is empty.
         */
        $isEmpty: (arg0: any) => boolean;
        /**
         * - Overrides model options.
         */
        $overrideModelOptions: (arg0: angular.NgModelOptions) => void;
        /**
         * - The current view value.
         */
        $viewValue: any;
        /**
         * - The current model value.
         */
        $modelValue: any;
        /**
         * - Array of parsers.
         */
        $parsers: Array<(arg0: any, arg1: any) => boolean>;
        /**
         * - Array of formatters.
         */
        $formatters: Array<(arg0: any) => any>;
        /**
         * - Array of view change listeners.
         */
        $viewChangeListeners: Array<() => any>;
        /**
         * - Validation errors.
         */
        $error: {
            [x: string]: boolean;
        };
        /**
         * - The name of the control.
         */
        $name?: string | undefined;
        /**
         * - True if the control has been touched.
         */
        $touched: boolean;
        /**
         * - True if the control has not been touched.
         */
        $untouched: boolean;
        /**
         * - Synchronous validators.
         */
        $validators: {
            [x: string]: (arg0: any, arg1: any) => boolean;
        };
        /**
         * - Asynchronous validators.
         */
        $asyncValidators: {
            [x: string]: (arg0: any, arg1: any) => angular.Promise<any>;
        };
        /**
         * - Pending validation.
         */
        $pending?: {
            [x: string]: boolean;
        } | undefined;
        /**
         * - True if the control is pristine.
         */
        $pristine: boolean;
        /**
         * - True if the control is dirty.
         */
        $dirty: boolean;
        /**
         * - True if the control is valid.
         */
        $valid: boolean;
        /**
         * - True if the control is invalid.
         */
        $invalid: boolean;
    };
    type NgModelOptions = {
        /**
         * - The event to update on.
         */
        updateOn?: string | undefined;
        /**
         * - The debounce delay.
         */
        debounce?: number | {
            [x: string]: number;
        } | undefined;
        /**
         * - Allows invalid models.
         */
        allowInvalid?: boolean | undefined;
        /**
         * - Indicates if getter/setter syntax is allowed.
         */
        getterSetter?: boolean | undefined;
        /**
         * - The timezone.
         */
        timezone?: string | undefined;
        /**
         * - The format for seconds in time and datetime-local inputs.
         */
        timeSecondsFormat?: string | undefined;
        /**
         * - Indicates if zero seconds should be stripped.
         */
        timeStripZeroSeconds?: boolean | undefined;
    };
}
export type TScope = import("./core/scope/scope").Scope;
export type TElement = import("./shared/jqlite/jqlite").JQLite;
export type TAttributes = angular.Attributes;
export type TController = angular.DirectiveController;
export type transcludeWithScope = (arg0: TScope, arg1: angular.CloneAttachFunction, arg2: JQLite | undefined, arg3: string | undefined) => JQLite;
export type transcludeWithoutScope = (arg0: angular.CloneAttachFunction | undefined, arg1: JQLite | undefined, arg2: string | undefined) => JQLite;
export type IModelValidators = {
    [x: string]: (arg0: any, arg1: any) => boolean;
};
export type IAsyncModelValidators = {
    [x: string]: (arg0: any, arg1: any) => IPromise<any>;
};
