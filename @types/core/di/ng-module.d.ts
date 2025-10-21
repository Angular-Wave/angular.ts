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
   * @param {import("../../interface.js").Injectable<any>} [configFn]
   */
  constructor(
    name: string,
    requires: Array<string>,
    configFn?: import("../../interface.js").Injectable<any>,
  );
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
  /** @type {!Array.<import("../../interface.js").Injectable<any>>} */
  runBlocks: Array<import("../../interface.js").Injectable<any>>;
  services: any[];
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
   * @param {import("../../interface.ts").Injectable<any>} configFn
   * @returns {NgModule}
   */
  config(configFn: import("../../interface.ts").Injectable<any>): NgModule;
  /**
   * @param {import("../../interface.ts").Injectable<any>} block
   * @returns {NgModule}
   */
  run(block: import("../../interface.ts").Injectable<any>): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.ts").ComponentOptions} options
   * @returns {NgModule}
   */
  component(
    name: string,
    options: import("../../interface.ts").ComponentOptions,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.ts").Injectable<any>} providerFunction
   * @returns {NgModule}
   */
  factory(
    name: string,
    providerFunction: import("../../interface.ts").Injectable<any>,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.ts").Injectable<any>} serviceFunction
   * @returns {NgModule}
   */
  service(
    name: string,
    serviceFunction: import("../../interface.ts").Injectable<any>,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.ts").Injectable<any>} providerType
   * @returns {NgModule}
   */
  provider(
    name: string,
    providerType: import("../../interface.ts").Injectable<any>,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable<any>} decorFn
   * @returns {NgModule}
   */
  decorator(
    name: string,
    decorFn: import("../../interface.js").Injectable<any>,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable<any>} directiveFactory
   * @returns {NgModule}
   */
  directive(
    name: string,
    directiveFactory: import("../../interface.js").Injectable<any>,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable<any>} animationFactory
   * @returns {NgModule}
   */
  animation(
    name: string,
    animationFactory: import("../../interface.js").Injectable<any>,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable<any>} filterFn
   * @return {NgModule}
   */
  filter(
    name: string,
    filterFn: import("../../interface.js").Injectable<any>,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable<any>} ctlFn
   * @returns {NgModule}
   */
  controller(
    name: string,
    ctlFn: import("../../interface.js").Injectable<any>,
  ): NgModule;
}
