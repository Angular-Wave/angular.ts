export class Module {
    constructor(name: any, requires: any, configFn: any);
    /**
     * @type {string}
     * Name of the module.
     */
    name: string;
    requires: any[];
    configFn: any;
    /** @type {!Array.<Array.<*>>} */
    invokeQueue: Array<Array<any>>;
    /** @type {!Array.<any>} */
    configBlocks: Array<any>;
    /** @type {!Array.<Function>} */
    runBlocks: Array<Function>;
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
     * @returns {Module}
     */
    value(name: string, object: any): Module;
    /**
     * @param {String} name
     * @param {any} object
     * @returns {Module}
     */
    constant(name: string, object: any): Module;
    config(...configFn: any[]): this;
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
