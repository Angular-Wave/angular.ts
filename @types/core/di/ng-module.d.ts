/** @private */
export const INJECTOR_LITERAL: "$injector";
/** @private */
export const COMPILE_LITERAL: "$compileProvider";
/** @private */
export const ANIMATION_LITERAL: "$animateProvider";
/** @private */
export const FILTER_LITERAL: "$filterProvider";
/** @private */
export const CONTROLLER_LITERAL: "$controllerProvider";
/**
 * Modules are collections of application configuration information for components:
 * controllers, directives, filters, etc. They provide recipes for the injector
 * to do the actual instantiation. A module itself has no behaviour but only state.
 * A such, it acts as a data structure between the Angular instance and the injector service.
 *
 * Since this is an internal structure that is exposed only via the Angular instance,
 * it contains no validation of the items it receives. It is up to the instantiator on
 * modules to do the actual validation.
 */
export class NgModule {
  /**
   * @param {string} name - Name of the module
   * @param {Array<string>} requires - List of modules which the injector will load before the current module
   * @param {Function} [configFn]
   */
  constructor(name: string, requires: Array<string>, configFn?: Function);
  /**
   * Name of the current module.
   * @type {string}
   */
  name: string;
  /**
   * Array of module names that this module depends on.
   * @type {string[]}
   */
  requires: string[];
  /**
   * Holds a collection of tasks, required to instantiate an angular component
   * @type {!Array<Array<*>>}
   */
  invokeQueue: Array<Array<any>>;
  /** @type {!Array<Array<*>>} */
  configBlocks: Array<Array<any>>;
  /** @type {!Array.<Function>} */
  runBlocks: Array<Function>;
  /**
   * @param {string} name
   * @param {any} object
   * @returns {NgModule}
   */
  value(name: string, object: any): NgModule;
  /**
   * @param {string} name
   * @param {any} object
   * @returns {NgModule}
   */
  constant(name: string, object: any): NgModule;
  /**
   *
   * @param {Function} configFn
   * @returns {NgModule}
   */
  config(configFn: Function): NgModule;
  /**
   * @param {Function} block
   * @returns {NgModule}
   */
  run(block: Function): NgModule;
  /**
   * @param {string} name
   * @param {*} options
   * @returns {NgModule}
   */
  component(name: string, options: any): NgModule;
  /**
   * @param {string} name
   * @param {*} providerFunction
   * @returns {NgModule}
   */
  factory(name: string, providerFunction: any): NgModule;
  /**
   * @param {string} name
   * @param {*} serviceFunction
   * @returns {NgModule}
   */
  service(name: string, serviceFunction: any): NgModule;
  /**
   * @param {string} name
   * @param {*} providerType
   * @returns {NgModule}
   */
  provider(name: string, providerType: any): NgModule;
  /**
   * @param {string} name
   * @param {*} decorFn
   * @returns {NgModule}
   */
  decorator(name: string, decorFn: any): NgModule;
  /**
   * @param {string} name
   * @param {*} directiveFactory
   * @returns {NgModule}
   */
  directive(name: string, directiveFactory: any): NgModule;
  /**
   * @param {string} name
   * @param {*} animationFactory
   * @returns {NgModule}
   */
  animation(name: string, animationFactory: any): NgModule;
  filter(name: any, filterFn: any): this;
  /**
   * @param {string} name
   * @param {*} ctlFn
   * @returns {NgModule}
   */
  controller(name: string, ctlFn: any): NgModule;
}
