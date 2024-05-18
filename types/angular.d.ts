///////////////////////////////////////////////////////////////////////////
    // AngularStatic
    // see http://docs.angularjs.org/api

import { IAngularBootstrapConfig, IErrorHandlingConfig, IModule, Injectable, auto } from ".";

///////////////////////////////////////////////////////////////////////////
interface IAngularStatic {
    /**
     * Expando cache for adding properties to DOM nodes.
     */
    cache: Map<number, any>;

    bind(context: any, fn: Function, ...args: any[]): Function;

    /**
     * Use this function to manually start up angular application.
     *
     * @param element DOM element which is the root of angular application.
     * @param modules An array of modules to load into the application.
     *     Each item in the array should be the name of a predefined module or a (DI annotated)
     *     function that will be invoked by the injector as a config block.
     * @param config an object for defining configuration options for the application. The following keys are supported:
     *     - `strictDi`: disable automatic function annotation for the application. This is meant to assist in finding bugs which break minified code.
     */
    bootstrap(
        element: string | Element | JQLite | Document,
        modules?: Array<string | Function | any[]>,
        config?: IAngularBootstrapConfig,
    ): auto.IInjectorService;

    /**
     * Wraps a raw DOM element or HTML string in JQLite.
     */
    element: JQLite;
    /**
     * Configure several aspects of error handling in AngularJS if used as a setter
     * or return the current configuration if used as a getter
     */
    errorHandlingConfig(): IErrorHandlingConfig;
    errorHandlingConfig(config: IErrorHandlingConfig): void;
    equals(value1: any, value2: any): boolean;
    extend(destination: any, ...sources: any[]): any;

    /**
     * Invokes the iterator function once for each item in obj collection, which can be either an object or an array. The iterator function is invoked with iterator(value, key), where value is the value of an object property or an array element and key is the object property key or array element index. Specifying a context for the function is optional.
     *
     * It is worth noting that .forEach does not iterate over inherited properties because it filters using the hasOwnProperty method.
     *
     * @param obj Object to iterate over.
     * @param iterator Iterator function.
     * @param context Object to become context (this) for the iterator function.
     */
    forEach<T, U extends ArrayLike<T> = T[]>(
        obj: U,
        iterator: (value: U[number], key: number, obj: U) => void,
        context?: any,
    ): U;
    /**
     * Invokes the iterator function once for each item in obj collection, which can be either an object or an array. The iterator function is invoked with iterator(value, key), where value is the value of an object property or an array element and key is the object property key or array element index. Specifying a context for the function is optional.
     *
     * It is worth noting that .forEach does not iterate over inherited properties because it filters using the hasOwnProperty method.
     *
     * @param obj Object to iterate over.
     * @param iterator Iterator function.
     * @param context Object to become context (this) for the iterator function.
     */
    forEach<T>(
        obj: { [index: string]: T },
        iterator: (value: T, key: string, obj: { [index: string]: T }) => void,
        context?: any,
    ): { [index: string]: T };
    /**
     * Invokes the iterator function once for each item in obj collection, which can be either an object or an array. The iterator function is invoked with iterator(value, key), where value is the value of an object property or an array element and key is the object property key or array element index. Specifying a context for the function is optional.
     *
     * It is worth noting that .forEach does not iterate over inherited properties because it filters using the hasOwnProperty method.
     *
     * @param obj Object to iterate over.
     * @param iterator Iterator function.
     * @param context Object to become context (this) for the iterator function.
     */
    forEach(obj: any, iterator: (value: any, key: any, obj: any) => void, context?: any): any;

    fromJson(json: string): any;
    identity<T>(arg?: T): T;
    injector(modules?: any[], strictDi?: boolean): auto.IInjectorService;
    isArray(value: any): boolean;
    isDate(value: any): boolean;
    isDefined(value: any): boolean;
    isElement(value: any): boolean;
    isFunction(value: any): boolean;
    isNumber(value: any): boolean;
    isObject(value: any): boolean;
    isString(value: any): boolean;
    isUndefined(value: any): boolean;

    /**
     * Deeply extends the destination object dst by copying own enumerable properties from the src object(s) to dst. You can specify multiple src objects. If you want to preserve original objects, you can do so by passing an empty object as the target: var object = angular.merge({}, object1, object2).
     *
     * Unlike extend(), merge() recursively descends into object properties of source objects, performing a deep copy.
     *
     * @param dst Destination object.
     * @param src Source object(s).
     */
    merge(dst: any, ...src: any[]): any;

    /**
     * The angular.module is a global place for creating, registering and retrieving Angular modules. All modules (angular core or 3rd party) that should be available to an application must be registered using this mechanism.
     *
     * When passed two or more arguments, a new module is created. If passed only one argument, an existing module (the name passed as the first argument to module) is retrieved.
     *
     * @param name The name of the module to create or retrieve.
     * @param requires The names of modules this module depends on. If specified then new module is being created. If unspecified then the module is being retrieved for further configuration.
     * @param configFn Optional configuration function for the module.
     */
    module(
        name: string,
        requires?: string[],
        configFn?: Injectable<Function>,
    ): IModule;

    noop(...args: any[]): void;
    reloadWithDebugInfo(): void;
    toJson(obj: any, pretty?: boolean | number): string;
    version: {
        full: string;
        major: number;
        minor: number;
        dot: number;
        codeName: string;
    };

    /**
     * If window.name contains prefix NG_DEFER_BOOTSTRAP! when angular.bootstrap is called, the bootstrap process will be paused until angular.resumeBootstrap() is called.
     * @param extraModules An optional array of modules that should be added to the original list of modules that the app was about to be bootstrapped with.
     */
    resumeBootstrap?(extraModules?: string[]): ng.auto.IInjectorService;
}