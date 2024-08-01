import { isFunction, isDefined, isObject, ngMinErr } from "../shared/utils";
export class Module {
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
    (this.requires = []), (this.configFn = configFn);

    /** @type {!Array.<Array.<*>>} */
    this.invokeQueue = [];

    /** @type {!Array.<any>} */
    this.configBlocks = [];

    /** @type {!Array.<Function>} */
    this.runBlocks = [];

    /** @type {Object} */
    this.infoState = {};
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
   * @returns {Module}
   */
  value(name, object) {
    this.invokeQueue.push(["$provide", "value", name, object]);
    return this;
  }

  /**
   * @param {String} name
   * @param {any} object
   * @returns {Module}
   */
  constant(name, object) {
    this.invokeQueue.unshift(["$provide", "constant", name, object]);
    return this;
  }

  config(...configFn) {
    this.configBlocks.push(["$injector", "invoke", configFn]);
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
    this.invokeQueue.push(["$compileProvider", "component", name, options]);
    return this;
  }

  factory(name, providerFunction) {
    providerFunction.$$moduleName = name;
    this.invokeQueue.push(["$provide", "factory", name, providerFunction]);
    return this;
  }

  service(name, serviceFunction) {
    serviceFunction.$$moduleName = name;
    this.invokeQueue.push(["$provide", "service", name, serviceFunction]);
    return this;
  }

  provider(name, providerType) {
    providerType.$$moduleName = name;
    this.invokeQueue.push(["$provide", "provider", name, providerType]);
    return this;
  }

  decorator(name, decorFn) {
    decorFn.$$moduleName = name;
    this.configBlocks.push(["$provide", "decorator", name, decorFn]);
    return this;
  }

  directive(name, directiveFactory) {
    directiveFactory.$$moduleName = name;
    this.configBlocks.push([
      "$compileProvider",
      "directive",
      name,
      directiveFactory,
    ]);
    return this;
  }

  animation(name, animationFactory) {
    animationFactory.$$moduleName = name;
    this.invokeQueue.push([
      "$animateProvider",
      "register",
      name,
      animationFactory,
    ]);
    return this;
  }

  filter(name, filterFn) {
    filterFn.$$moduleName = name;
    this.configBlocks.push(["$filterProvider", "register", name, filterFn]);
    return this;
  }

  controller(name, ctlFn) {
    ctlFn.$$moduleName = name;
    this.configBlocks.push(["$controllerProvider", "register", name, ctlFn]);
    return this;
  }
}
