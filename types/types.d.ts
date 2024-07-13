export type BootstrapConfig = any;
export type Injectable<T_1> = Function | Array<string | Function>;
export type ComponentOptions = any;
export type ControllerConstructor = Function;
export type OnChangesObject = any;
export type ChangesObject = any;
export type Controller = any;
export type Attributes = {
    [x: string]: any;
};
export type TScope = import("./core/scope/scope").Scope;
export type TElement = import("./shared/jqlite/jqlite").JQLite;
export type TAttributes = Attributes;
export type TController = DirectiveController;
export type DirectiveController = Controller | Controller[] | {
    [key: string]: Controller;
};
/**
 * Compile function for an AngularJS directive.
 */
export type DirectiveCompileFn<TScope, TElement, TAttributes, TController> = (templateElement: TElement, templateAttributes: TAttributes, transclude: TranscludeFunction) => any;
/**
 * Link function for an AngularJS directive.
 */
export type DirectiveLinkFn<TScope, TElement, TAttributes, TController> = (scope: TScope, instanceElement: TElement, instanceAttributes: TAttributes, controller?: TController, transclude?: TranscludeFunction) => void;
export type CloneAttachFunction = (clonedElement?: JQLite, scope?: Scope) => any;
/**
 * This corresponds to $transclude passed to controllers and to the transclude function passed to link functions.
 * https://docs.angularjs.org/api/ng/service/$compile#-controller-
 * http://teropa.info/blog/2015/06/09/transclusion.html
 */
export type TranscludeFunction = {
    transcludeWithScope: (arg0: TScope, arg1: CloneAttachFunction, arg2: JQLite | undefined, arg3: string | undefined) => JQLite;
    transcludeWithoutScope: (arg0: CloneAttachFunction | undefined, arg1: JQLite | undefined, arg2: string | undefined) => JQLite;
    /**
     * - Returns true if the specified slot contains content (i.e., one or more DOM nodes)
     */
    isSlotFilled: (arg0: string) => boolean;
};
export type transcludeWithScope = (arg0: TScope, arg1: CloneAttachFunction, arg2: JQLite | undefined, arg3: string | undefined) => JQLite;
export type transcludeWithoutScope = (arg0: CloneAttachFunction | undefined, arg1: JQLite | undefined, arg2: string | undefined) => JQLite;
/**
 * Represents the pre and post linking functions of a directive.
 */
export type DirectivePrePost<TScope, TElement, TAttributes, TController> = {
    /**
     * The pre-linking function of the directive.
     */
    pre?: DirectiveLinkFn<S, T, A, C> | undefined;
    /**
     * The post-linking function of the directive.
     */
    post?: DirectiveLinkFn<S, T, A, C> | undefined;
};
/**
 * Directive definition object.
 */
export type Directive<TScope, TElement, TAttributes, TController> = {
    /**
     * Compile function for the directive.
     */
    compile?: DirectiveCompileFn<S, T, A, C> | undefined;
    /**
     * Controller constructor or name.
     */
    controller?: string | Injectable<ControllerConstructor> | undefined;
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
    link?: DirectiveLinkFn<S, T, A, C> | DirectivePrePost<S, T, A, C> | undefined;
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
export type DirectiveFactory<TScope, TElement, TAttributes, TController> = (...args: any[]) => Directive<S, T, A, C> | DirectiveLinkFn<S, T, A, C>;
export type FilterFunction = Function;
export type FilterFactory = Function;
/**
 * Interface for a service provider class.
 */
export type ServiceProviderClass = {
    /**
     * - The constructor for the service provider.
     */
    constructor: Function;
};
/**
 * Interface for a service provider factory function.
 */
export type ServiceProviderFactory = Function;
/**
 * Interface for a service provider.
 */
export type ServiceProvider = {
    /**
     * - The $get property that represents a service instance or a factory function.
     */
    $get: any;
};
export type Module = any;
export type FormController = {
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
        [x: string]: Array<NgModelController | FormController>;
    };
    /**
     * - The name of the form.
     */
    $name?: string | undefined;
    /**
     * - An object containing arrays of controls that are pending validation, keyed by validation error keys.
     */
    $pending?: {
        [x: string]: Array<NgModelController | FormController>;
    } | undefined;
    /**
     * - Adds a control to the form.
     */
    $addControl: (arg0: NgModelController | FormController) => void;
    /**
     * - Returns an array of all controls in the form.
     */
    $getControls: () => ReadonlyArray<NgModelController | FormController>;
    /**
     * - Removes a control from the form.
     */
    $removeControl: (arg0: NgModelController | FormController) => void;
    /**
     * - Sets the validity of a control in the form.
     */
    $setValidity: (arg0: string, arg1: boolean, arg2: NgModelController | FormController) => void;
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
export type NgModelController = {
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
    $overrideModelOptions: (arg0: NgModelOptions) => void;
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
        [x: string]: (arg0: any, arg1: any) => Promise<any>;
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
export type NgModelOptions = {
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
export type IModelValidators = {
    [x: string]: (arg0: any, arg1: any) => boolean;
};
export type IAsyncModelValidators = {
    [x: string]: (arg0: any, arg1: any) => Promise<any>;
};
export type InjectorService = {
    /**
     * Annotate a function or an array of inline annotations.
     */
    annotate: (arg0: Function, arg1: boolean | undefined) => string[];
    /**
     * Get a service by name.
     */
    get: (arg0: string, arg1: string | undefined) => T;
    /**
     * , any=): T} instantiate Instantiate a type constructor with optional locals.
     */
    "": new () => (...args: any[]) => any;
    /**
     * Invoke a function with optional context and locals.
     */
    invoke: (arg0: Injectable<Function | ((...args: any[]) => T)>, arg1: any | undefined, arg2: any | undefined) => T;
    /**
     * Add and load new modules to the injector.
     */
    loadNewModules: (arg0: Array<Module | string | Injectable<(...args: any[]) => void>>) => void;
    /**
     * A map of all the modules loaded into the injector.
     */
    modules: {
        [x: string]: Module;
    };
    /**
     * Indicates if strict dependency injection is enforced.
     */
    strictDi: boolean;
};
