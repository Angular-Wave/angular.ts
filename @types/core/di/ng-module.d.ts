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
   * @param {import("../../interface.js").Injectable} [configFn]
   */
  constructor(
    name: string,
    requires: Array<string>,
    configFn?: import("../../interface.js").Injectable,
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
  /** @type {!Array.<import("../../interface.js").Injectable>} */
  runBlocks: Array<import("../../interface.js").Injectable>;
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
   * @param {import("../../interface.js").Injectable} configFn
   * @returns {NgModule}
   */
  config(configFn: import("../../interface.js").Injectable): NgModule;
  /**
   * @param {import("../../interface.js").Injectable} block
   * @returns {NgModule}
   */
  run(block: import("../../interface.js").Injectable): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").ComponentOptions} options
   * @returns {NgModule}
   */
  component(
    name: string,
    options: import("../../interface.js").ComponentOptions,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} providerFunction
   * @returns {NgModule}
   */
  factory(
    name: string,
    providerFunction: import("../../interface.js").Injectable,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} serviceFunction
   * @returns {NgModule}
   */
  service(
    name: string,
    serviceFunction: import("../../interface.js").Injectable,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} providerType
   * @returns {NgModule}
   */
  provider(
    name: string,
    providerType: import("../../interface.js").Injectable,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} decorFn
   * @returns {NgModule}
   */
  decorator(
    name: string,
    decorFn: import("../../interface.js").Injectable,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} directiveFactory
   * @returns {NgModule}
   */
  directive(
    name: string,
    directiveFactory: import("../../interface.js").Injectable,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} animationFactory
   * @returns {NgModule}
   */
  animation(
    name: string,
    animationFactory: import("../../interface.js").Injectable,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} filterFn
   * @return {NgModule}
   */
  filter(
    name: string,
    filterFn: import("../../interface.js").Injectable,
  ): NgModule;
  /**
   * @param {string} name
   * @param {import("../../interface.js").Injectable} ctlFn
   * @returns {NgModule}
   */
  controller(
    name: string,
    ctlFn: import("../../interface.js").Injectable,
  ): NgModule;
}
