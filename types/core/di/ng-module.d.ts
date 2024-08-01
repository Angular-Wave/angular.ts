export const PROVIDE_LITERAL: "$provide";
export const INJECTOR_LITERAL: "$injector";
export const COMPILE_LITERAL: "$compileProvider";
export const ANIMATION_LITERAL: "$animateProvider";
export const FILTER_LITERAL: "$filterProvider";
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
    /**
     * Holds a collection of tasks, required to instantiate an angular component
     * @type {!Array.<Array.<*>>}
     */
    invokeQueue: Array<Array<any>>;
    /** @type {!Array.<any>} */
    configBlocks: Array<any>;
    /** @type {!Array.<Function>} */
    runBlocks: Array<Function>;
    /** @type {Object} */
    infoState: any;
    /**
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
    /**
     *
     * @param {Function} configFn
     * @returns {NgModule}
     */
    config(configFn: Function): NgModule;
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
