import { Attributes } from "./core/compile/attributes.js";
import { Scope } from "./core/scope/scope.js";
export * from "./services/http/interface.ts";
export * from "./services/log/interface.ts";
export * from "./services/log/log.js";
export * from "./services/pubsub/pubsub.js";
export * from "./services/template-cache/interface.ts";
export * from "./services/template-cache/template-cache.js";

/**
 * A JavaScript expression represented as a string, typically used in interpolation bindings.
 *
 * Example:
 * ```html
 * <span title="{{ attrBinding }}">{{ textBinding }}</span>
 * ```
 *
 */
export type Expression = string;

export type ExpandoStore = {
  data: { [key: string]: any };
};

/**
 * A dependency-annotated factory array used by AngularTS DI system.
 *
 * It consists of zero or more dependency names (as strings), followed by
 * a factory function that takes those dependencies as arguments.
 *
 * Example:
 * ```ts
 * ['dep1', 'dep2', function(dep1, dep2) { ... }]
 * ```
 */
export type AnnotatedFactory = [...string[], (...args: any[]) => any];

/**
 * A factory that can be either a standalone function or a dependency-annotated array.
 *
 * The array form is used to support minification-safe dependency injection.
 * See {@link AnnotatedFactory}.
 */
export type InjectableFactory = (...args: any[]) => any;

export type Injectable = AnnotatedFactory | InjectableFactory;

/**
 * An object that defines how a service is constructed.
 *
 * It must define a `$get` property that provides the instance of the service,
 * either as a plain factory function or as an {@link AnnotatedFactory}.
 */
export interface ServiceProvider {
  $get: Injectable;
}

/**
 * The API for registering different types of providers with the injector.
 *
 * This interface is used within AngularTS's `$provide` service to define
 * services, factories, constants, values, decorators, etc.
 */
export interface Provider {
  /**
   * Register a service provider.
   * @param name - The name of the service.
   * @param provider - An object with a `$get` property that defines how the service is created.
   */
  provider(name: string, provider: ServiceProvider): Provider;

  /**
   * Register a factory function to create a service.
   * @param name - The name of the service.
   * @param factoryFn - A function (or annotated array) that returns the service instance.
   */
  factory(name: string, factoryFn: Injectable): Provider;

  /**
   * Register a constructor function to create a service.
   * @param name - The name of the service.
   * @param constructor - A class or function to instantiate.
   */
  service(name: string, constructor: Injectable): Provider;

  /**
   * Register a fixed value as a service.
   * @param name - The name of the service.
   * @param val - The value to use.
   */
  value(name: string, val: any): Provider;

  /**
   * Register a constant value (available during config).
   * @param name - The name of the constant.
   * @param val - The constant value.
   */
  constant(name: string, val: any): Provider;

  /**
   * Register a decorator function to modify or replace an existing service.
   * @param name - The name of the service to decorate.
   * @param fn - A function that takes `$delegate` and returns a decorated service.
   */
  decorator(name: string, fn: Injectable): Provider;
}

/**
 * A filter function takes an input and optional arguments, and returns a transformed value.
 */
export type FilterFn = (input: any, ...args: any[]) => any;

/**
 * A filter factory function that returns a FilterFn.
 */
export type FilterFactory = (...args: any[]) => FilterFn;

/**
 * A controller constructor function used in AngularTS.
 */
export type ControllerConstructor = (...args: any[]) => void | Controller;

/**
 * Describes the changes in component bindings during `$onChanges`.
 */
export interface ChangesObject<T = any> {
  /** New value of the binding */
  currentValue: T;
  /** Whether this is the first change */
  isFirstChange: () => boolean;
}

/**
 * Mapping of binding property names to their change metadata.
 */
export type OnChangesObject = Record<string, ChangesObject>;

/**
 * AngularTS component lifecycle interface.
 */
export interface Controller {
  /** Optional controller name (used in debugging) */
  name?: string;
  /** Called when the controller is initialized */
  $onInit?: () => void;
  /** Called when one-way bindings are updated */
  $onChanges?: (changes: OnChangesObject) => void;
  /** Called before the controller is destroyed */
  $onDestroy?: () => void;
  /** Called after the component is linked */
  $postLink?: () => void;
}

/**
 * Defines a component's configuration object.
 */
export interface ComponentOptions {
  /** Controller function or injectable string reference */
  controller?: string | Injectable;
  /** Alias name for the controller in templates */
  controllerAs?: string;
  /** Inline HTML template */
  template?: string | Injectable;
  /** URL of the HTML template */
  templateUrl?: string | Injectable;
  /** Binding definitions (e.g., `@`, `=`, `<`) */
  bindings?: Record<string, string>;
  /** Enable transclusion or specify named slots */
  transclude?: boolean | Record<string, string>;
  /** Required controllers from other directives */
  require?: Record<string, string>;
}

/**
 * A controller instance or object map used in directives.
 */
export type DirectiveController =
  | Controller
  | Controller[]
  | { [key: string]: Controller };

/**
 * Represents a controller used within directive link functions.
 */
export type TController = DirectiveController | NgModelController;

/**
 * Defines optional pre/post link functions in directive compile phase.
 */
export interface DirectivePrePost {
  pre?: DirectiveLinkFn;
  post?: DirectiveLinkFn;
}

/**
 * A link function executed during directive linking.
 */
export type DirectiveLinkFn = (
  scope: Scope,
  element: HTMLElement,
  attrs: Attributes,
  controller?: TController,
  transclude?: (...args: any[]) => any,
) => void;

/**
 * A compile function used to prepare directives before linking.
 */
export type DirectiveCompileFn = (
  templateElement: HTMLElement,
  templateAttributes: Attributes,
  transclude: (...args: any[]) => any,
) => void | DirectiveLinkFn | DirectivePrePost;

/**
 * Defines the structure of an AngularTS directive.
 */
export interface Directive {
  /** Optional name (usually inferred) */
  name?: string;
  /** Restrict option: 'A' and/or 'E'. Defaults to 'EA' */
  restrict?: string;
  /** Compile function for the directive */
  compile?: DirectiveCompileFn;
  /** Controller constructor or injectable string name */
  controller?: string | Injectable | any;
  /** Alias name for the controller in templates */
  controllerAs?: string;
  /** Whether to bind scope to controller */
  bindToController?: boolean | Record<string, string>;
  /** Link function(s) executed during linking */
  link?: DirectiveLinkFn | DirectivePrePost;
  /** Priority of the directive */
  priority?: number;
  /** Stops further directive processing if true */
  terminal?: boolean;
  /** Replaces the element with the template if true */
  replace?: boolean;
  /** Required controllers for the directive */
  require?: string | string[] | Record<string, string>;
  /** Scope configuration (`true`, `false`, or object for isolate scope) */
  scope?: boolean | Record<string, string>;
  /** Inline template */
  template?: string | ((element: Element, attrs: Attributes) => string);
  /** Template namespace (e.g., SVG, HTML) */
  templateNamespace?: string;
  /** Template URL for loading from server */
  templateUrl?: string | ((element: Element, attrs: Attributes) => string);
  /** Enables transclusion or configures named slots */
  transclude?: boolean | "element" | Record<string, string>;
  /** Internal hook for directive compilation state */
  $$addStateInfo?: (...args: any[]) => any;
}

/**
 * A factory function returning a directive definition.
 */
export type DirectiveFactory = (...args: any[]) => Directive | DirectiveLinkFn;

/**
 * Represents advanced transclusion functions used in directives.
 */
export interface TranscludeFunctionObject {
  /** Transcludes content with a new scope */
  transcludeWithScope(
    scope: Scope,
    cloneAttachFn: CloneAttachFunction,
    element?: Element,
    slotName?: string,
  ): Element;
  /** Transcludes content without creating a new scope */
  transcludeWithoutScope(
    cloneAttachFn?: CloneAttachFunction,
    element?: Element,
    slotName?: string,
  ): Element;
  /** Checks if a named slot is filled */
  isSlotFilled(slotName: string): boolean;
}

/**
 * Callback used when transcluded content is cloned.
 */
export type CloneAttachFunction = (
  clonedElement?: Element,
  scope?: Scope,
) => any;

/**
 * Configuration for ngModel behavior.
 */
export interface NgModelOptions {
  /** Space-separated event names that trigger updates */
  updateOn?: string;
  /** Delay in milliseconds or event-specific debounce times */
  debounce?: number | Record<string, number>;
  /** Whether to allow invalid values */
  allowInvalid?: boolean;
  /** Enables getter/setter style ngModel */
  getterSetter?: boolean;
  /** Timezone used for Date objects */
  timezone?: string;
  /** Time display format including seconds */
  timeSecondsFormat?: string;
  /** Whether to remove trailing :00 seconds */
  timeStripZeroSeconds?: boolean;
}

/**
 * Controller API for ngModel directive.
 */
export interface NgModelController {
  /** Updates the view when the model changes */
  $render(): void;
  /** Sets the validity state of the control */
  $setValidity(validationErrorKey: string, isValid: boolean): void;
  /** Updates the model value */
  $setViewValue(value: any, trigger?: string): void;
  /** Marks the control as pristine */
  $setPristine(): void;
  /** Marks the control as dirty */
  $setDirty(): void;
  /** Re-validates the model */
  $validate(): void;
  /** Marks the control as touched */
  $setTouched(): void;
  /** Marks the control as untouched */
  $setUntouched(): void;
  /** Rolls back to previous view value */
  $rollbackViewValue(): void;
  /** Commits the current view value to the model */
  $commitViewValue(): void;
  /** Processes view-to-model transformations */
  $processModelValue(): void;
  /** Determines if value is considered empty */
  $isEmpty(value: any): boolean;
  /** Overrides the model options dynamically */
  $overrideModelOptions(options: NgModelOptions): void;
  /** Current value shown in the view */
  $viewValue: any;
}

/**
 * Possible values for `data-swap` attribute
 */
export type SwapInsertPosition =
  | InsertPosition
  | "textContent"
  | "innerHTML"
  | "outerHTML"
  | "delete"
  | "none";
