import {
  isFunction,
  isDefined,
  isObject,
  isString,
  assert,
} from "../../shared/utils";

export const PROVIDE_LITERAL = "$provide";
export const INJECTOR_LITERAL = "$injector";
export const COMPILE_LITERAL = "$compileProvider";
export const ANIMATION_LITERAL = "$animateProvider";
export const FILTER_LITERAL = "$filterProvider";
export const CONTROLLER_LITERAL = "$controllerProvider";

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
   * @param {String} name - Name of the module
   * @param {Array<String>} requires - List of modules which the injector will load before the current module
   * @param {Function} [configFn]
   */
  constructor(name, requires, configFn) {
    assert(isString(name), "name required");
    assert(Array.isArray(requires), "requires array required");
    /**
     * @type {string}
     * Name of the module.
     */
    this.name = name;
    /**
     * Holds the list of modules which the injector will load before the current module is
     * loaded.
     */
    this.requires = requires;

    /**
     * Holds a collection of tasks, required to instantiate an angular component
     * @type {!Array<Array<*>>}
     */
    this.invokeQueue = [];

    /** @type {!Array<Array<*>>} */
    this.configBlocks = [];

    /** @type {!Array.<Function>} */
    this.runBlocks = [];

    /** @type {Object} */
    this.infoState = {};

    if (configFn) {
      this.config(configFn);
    }
  }

  /**
   * @param {Object} value
   * @returns
   */
  info(value) {
    if (isDefined(value)) {
      assert(isObject(value), "module info value must be an object");
      this.infoState = value;
      return this;
    }
    return this.infoState;
  }

  /**
   * @param {string} name
   * @param {any} object
   * @returns {NgModule}
   */
  value(name, object) {
    this.invokeQueue.push([PROVIDE_LITERAL, "value", [name, object]]);
    return this;
  }

  /**
   * @param {string} name
   * @param {any} object
   * @returns {NgModule}
   */
  constant(name, object) {
    this.invokeQueue.unshift([PROVIDE_LITERAL, "constant", [name, object]]);
    return this;
  }

  /**
   *
   * @param {Function} configFn
   * @returns {NgModule}
   */
  config(configFn) {
    this.configBlocks.push([INJECTOR_LITERAL, "invoke", [configFn]]);
    return this;
  }

  /**
   * @param {Function} block
   * @returns {NgModule}
   */
  run(block) {
    this.runBlocks.push(block);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} options
   * @returns {NgModule}
   */
  component(name, options) {
    if (options && isFunction(options)) {
      options.$$moduleName = name;
    }
    this.invokeQueue.push([COMPILE_LITERAL, "component", [name, options]]);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} providerFunction
   * @returns {NgModule}
   */
  factory(name, providerFunction) {
    if (providerFunction && isFunction(providerFunction)) {
      providerFunction.$$moduleName = name;
    }
    this.invokeQueue.push([
      PROVIDE_LITERAL,
      "factory",
      [name, providerFunction],
    ]);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} serviceFunction
   * @returns {NgModule}
   */
  service(name, serviceFunction) {
    if (serviceFunction && isFunction(serviceFunction)) {
      serviceFunction.$$moduleName = name;
    }
    this.invokeQueue.push([
      PROVIDE_LITERAL,
      "service",
      [name, serviceFunction],
    ]);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} providerType
   * @returns {NgModule}
   */
  provider(name, providerType) {
    if (providerType && isFunction(providerType)) {
      providerType.$$moduleName = name;
    }
    this.invokeQueue.push([PROVIDE_LITERAL, "provider", [name, providerType]]);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} decorFn
   * @returns {NgModule}
   */
  decorator(name, decorFn) {
    if (decorFn && isFunction(decorFn)) {
      decorFn.$$moduleName = name;
    }
    this.configBlocks.push([PROVIDE_LITERAL, "decorator", [name, decorFn]]);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} directiveFactory
   * @returns {NgModule}
   */
  directive(name, directiveFactory) {
    if (directiveFactory && isFunction(directiveFactory)) {
      directiveFactory.$$moduleName = name;
    }
    this.invokeQueue.push([
      COMPILE_LITERAL,
      "directive",
      [name, directiveFactory],
    ]);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} animationFactory
   * @returns {NgModule}
   */
  animation(name, animationFactory) {
    if (animationFactory && isFunction(animationFactory)) {
      animationFactory.$$moduleName = name;
    }
    this.invokeQueue.push([
      ANIMATION_LITERAL,
      "register",
      [name, animationFactory],
    ]);
    return this;
  }

  filter(name, filterFn) {
    if (filterFn && isFunction(filterFn)) {
      filterFn.$$moduleName = name;
    }
    this.invokeQueue.push([FILTER_LITERAL, "register", [name, filterFn]]);
    return this;
  }

  /**
   * @param {string} name
   * @param {*} ctlFn
   * @returns {NgModule}
   */
  controller(name, ctlFn) {
    if (ctlFn && isFunction(ctlFn)) {
      ctlFn.$$moduleName = name;
    }
    this.invokeQueue.push([CONTROLLER_LITERAL, "register", [name, ctlFn]]);
    return this;
  }
}
