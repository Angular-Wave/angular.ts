import { Angular, angularInit } from "./loader";
import { publishExternalAPI } from "./public";

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
 * @typedef {angular.Controller | angular.Controller[] | { [key: string]: angular.Controller }} IDirectiveController
 * @description Represents a directive controller, which can be:
 * - A single instance of {@link angular.Controller}
 * - An array of {@link angular.Controller}
 * - An object where keys are string identifiers and values are {@link IController}
 */

/**
 * Compile function for an AngularJS directive.
 *
 * @template TScope - The type of the directive's scope.
 * @template TElement - The type of the directive's element.
 * @template TAttributes - The type of the directive's attributes.
 * @template TController - The type of the directive's controller.
 *
 * @callback angular.DirectiveCompileFn
 * @param {TElement} templateElement - The template element.
 * @param {TAttributes} templateAttributes - The template attributes.
 * @param {ITranscludeFunction} transclude - @deprecated The transclude function. Note: The transclude function that is passed to the compile function is deprecated,
 * as it e.g. does not know about the right outer scope. Please use the transclude function
 * that is passed to the link function instead.
 * @returns {void | angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController> | angular.DirectivePrePost<TScope, TElement, TAttributes, TController>} Returns void, angular.DirectiveLinkFn, or  angular.DirectivePrePost.
 */

/**
 * Link function for an AngularJS directive.
 *
 * @template TScope - The type of the directive's scope.
 * @template TElement - The type of the directive's element.
 * @template TAttributes - The type of the directive's attributes.
 * @template TController - The type of the directive's controller.
 *
 * @callback angular.DirectiveLinkFn
 * @param {TScope} scope - The scope instance for the directive.
 * @param {TElement} instanceElement - The jqLite-wrapped element that this directive matches.
 * @param {TAttributes} instanceAttributes - The normalized attributes for the element.
 * @param {TController} [controller] - The directive's required controller(s) instance(s) or its name(s).
 * @param {ITranscludeFunction} [transclude] - A transclude linking function pre-bound to the correct transclusion scope.
 * @returns {void}
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
 * @property {angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController> | undefined} [pre]
 *   The pre-linking function of the directive.
 * @property {angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController> | undefined} [post]
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
 * @typedef {Object} IDirective
 * @property {angular.DirectiveCompileFn<TScope, TElement, TAttributes, TController> | undefined} [compile]
 * Compile function for the directive.
 * @property {string | angular.Injectable<angular.ControllerConstructor> | undefined} [controller]
 * Controller constructor or name.
 * @property {string | undefined} [controllerAs]
 * Controller alias.
 * @property {boolean | { [boundProperty: string]: string } | undefined} [bindToController]
 * Bindings to controller.
 * @property {angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController> |  angular.DirectivePrePost<TScope, TElement, TAttributes, TController> | undefined} [link]
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
 * @typedef {(...args: any[]) => IDirective<TScope, TElement, TAttributes, TController> | angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController>} IDirectiveFactory
 */

/**
 * @typedef {Object} angular.Module
 * @description AngularJS module interface for registering components, services, providers, etc.
 * @property {function(string, angular.ComponentOptions): angular.Module} component
 *   Use this method to register a component.
 * @property {function({ [componentName: string]: angular.ComponentOptions }): angular.Module} component
 *   Use this method to register multiple components.
 * @property {function(Function): angular.Module} config
 *   Use this method to register work which needs to be performed on module loading.
 * @property {function(any[]): angular.Module} config
 *   Use this method to register work which needs to be performed on module loading.
 * @property {function<T>(string, T): angular.Module} constant
 *   Register a constant service with the $injector.
 * @property {function(Object): angular.Module} constant
 *   Register multiple constant services.
 * @property {function(string, angular.Injectable<angular.ControllerConstructor>): angular.Module} controller
 *   Register a controller with the $controller service.
 * @property {function({ [name: string]: angular.Injectable<angular.ControllerConstructor>> }): angular.Module} controller
 *   Register multiple controllers.
 * @property {function<TScope, TElement, TAttributes, TController>(string, angular.Injectable<IDirectiveFactory<TScope, TElement, TAttributes, TController>>): angular.Module} directive
 *   Register a directive with the compiler.
 * @property {function<TScope, TElement, TAttributes, TController>(Object.<string, angular.Injectable<IDirectiveFactory<TScope, TElement, TAttributes, TController>>>): angular.Module} directive
 *   Register multiple directives.
 * @property {function(string, angular.Injectable<Function>): angular.Module} factory
 *   Register a service factory with the $injector.
 * @property {function(Object.<string, angular.Injectable<Function>>): angular.Module} factory
 *   Register multiple service factories.
 * @property {function(string, angular.Injectable<FilterFactory>): angular.Module} filter
 *   Register a filter service.
 * @property {function(Object.<string, angular.Injectable<FilterFactory>>): angular.Module} filter
 *   Register multiple filter services.
 * @property {function(string, IServiceProviderFactory): angular.Module} provider
 *   Register a provider service factory.
 * @property {function(string, IServiceProviderClass): angular.Module} provider
 *   Register a provider service constructor.
 * @property {function(string, any[]): angular.Module} provider
 *   Register a provider service with inline annotated constructor.
 * @property {function(angular.Injectable<Function>): angular.Module} run
 *   Register code to be run during module loading.
 * @property {function(string, angular.Injectable<Function>): angular.Module} service
 *   Register a service constructor.
 * @property {function(Object.<string, angular.Injectable<Function>>): angular.Module} service
 *   Register multiple service constructors.
 * @property {function<T>(string, T): angular.Module} value
 *   Register a value service with the $injector.
 * @property {function(Object): angular.Module} value
 *   Register multiple value services.
 * @property {function(string, angular.Injectable<Function>): angular.Module} decorator
 *   Register a service decorator with the $injector.
 * @property {string} name
 *   The name of the AngularJS module.
 * @property {string[]} requires
 *   Array of module names that this module depends on.
 */

/**
 * @type {Angular}
 */
window.angular = new Angular();

publishExternalAPI();

document.addEventListener("DOMContentLoaded", () => {
  angularInit(document);
});
