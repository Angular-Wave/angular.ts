export class NgModule {
    /**
     *
     * @param {String} name - Name of the module
     * @param {Array<String>} requires - List of modules which the injector will load before the current module
     * @param {Function} [configFn]
     */
    constructor(name: string, requires: Array<string>, configFn?: Function);
    /**
     * @type {string}
     * Name of the module.
     */
    name: string;
    /**
     * Holds the list of modules which the injector will load before the current module is
     * loaded.
     */
    requires: string[];
    configFn: Function;
    /** @type {!Array.<Array.<*>>} */
    _invokeQueue: Array<Array<any>>;
    /** @type {!Array.<any>} */
    _configBlocks: Array<any>;
    /** @type {!Array.<Function>} */
    _runBlocks: Array<Function>;
    /** @type {Object} */
    infoState: any;
    /**
     *
     * @param {Object} value
     * @returns
     */
    info(value: any): any;
    /**
     * @param {String} name
     * @param {any} object
     * @returns {NgModule}
     */
    value(name: string, object: any): NgModule;
    /**
     * @param {String} name
     * @param {any} object
     * @returns {NgModule}
     */
    constant(name: string, object: any): NgModule;
    config(configFn: any): this;
    run(block: any): this;
    component(name: any, options: any): this;
    factory(name: any, providerFunction: any): this;
    service(name: any, serviceFunction: any): this;
    provider(name: any, providerType: any): this;
    decorator(name: any, decorFn: any): this;
    directive(name: any, directiveFactory: any): this;
    animation(name: any, animationFactory: any): this;
    filter(name: any, filterFn: any): this;
    controller(name: any, ctlFn: any): this;
}
