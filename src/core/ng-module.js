import { isFunction, isDefined, isObject, minErr } from "../shared/utils";

const ngMinErr = minErr("ng");

export class NgModule {
  /**
   *
   * @param {String} name - Name of the module
   * @param {Array<String>} requires - List of modules which the injector will load before the current module
   * @param {Function} [configFn]
   */
  constructor(name, requires, configFn) {
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

    this.configFn = configFn;

    /** @type {!Array.<Array.<*>>} */
    this.invokeQueue = [];

    /** @type {!Array.<any>} */
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
   *
   * @param {Object} value
   * @returns
   */
  info(value) {
    if (isDefined(value)) {
      if (!isObject(value))
        throw ngMinErr("aobj", "Argument '{0}' must be an object", "value");
      this.infoState = value;
      return this;
    }
    return this.infoState;
  }

  /**
   * @param {String} name
   * @param {any} object
   * @returns {NgModule}
   */
  value(name, object) {
    this.invokeQueue.push(["$provide", "value", [name, object]]);
    return this;
  }

  /**
   * @param {String} name
   * @param {any} object
   * @returns {NgModule}
   */
  constant(name, object) {
    this.invokeQueue.unshift(["$provide", "constant", [name, object]]);
    return this;
  }

  config(configFn) {
    this.configBlocks.push(["$injector", "invoke", [configFn]]);
    return this;
  }

  run(block) {
    this.runBlocks.push(block);
    return this;
  }

  component(name, options) {
    if (options && isFunction(options)) {
      options.$$moduleName = name;
    }
    this.invokeQueue.push(["$compileProvider", "component", [name, options]]);
    return this;
  }

  factory(name, providerFunction) {
    if (providerFunction && isFunction(providerFunction)) {
      providerFunction.$$moduleName = name;
    }
    this.invokeQueue.push(["$provide", "factory", [name, providerFunction]]);
    return this;
  }

  service(name, serviceFunction) {
    if (serviceFunction && isFunction(serviceFunction)) {
      serviceFunction.$$moduleName = name;
    }
    this.invokeQueue.push(["$provide", "service", [name, serviceFunction]]);
    return this;
  }

  provider(name, providerType) {
    if (providerType && isFunction(providerType)) {
      providerType.$$moduleName = name;
    }
    this.invokeQueue.push(["$provide", "provider", [name, providerType]]);
    return this;
  }

  decorator(name, decorFn) {
    if (decorFn && isFunction(decorFn)) {
      decorFn.$$moduleName = name;
    }
    this.configBlocks.push(["$provide", "decorator", [name, decorFn]]);
    return this;
  }

  directive(name, directiveFactory) {
    if (directiveFactory && isFunction(directiveFactory)) {
      directiveFactory.$$moduleName = name;
    }
    this.invokeQueue.push([
      "$compileProvider",
      "directive",
      [name, directiveFactory],
    ]);
    return this;
  }

  animation(name, animationFactory) {
    if (animationFactory && isFunction(animationFactory)) {
      animationFactory.$$moduleName = name;
    }
    this.invokeQueue.push([
      "$animateProvider",
      "register",
      [name, animationFactory],
    ]);
    return this;
  }

  filter(name, filterFn) {
    if (filterFn && isFunction(filterFn)) {
      filterFn.$$moduleName = name;
    }
    this.invokeQueue.push(["$filterProvider", "register", [name, filterFn]]);
    return this;
  }

  controller(name, ctlFn) {
    if (ctlFn && isFunction(ctlFn)) {
      ctlFn.$$moduleName = name;
    }
    this.invokeQueue.push(["$controllerProvider", "register", [name, ctlFn]]);
    return this;
  }
}
