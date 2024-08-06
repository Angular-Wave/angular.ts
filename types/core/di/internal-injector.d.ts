export class ProviderInjector {
    /**
     *
     * @param {Object} cache
     * @param {boolean} strictDi
     */
    constructor(cache: any, strictDi: boolean);
    cache: any;
    strictDi: boolean;
    path: any[];
    providerCache: any;
    modules: any;
    factory(caller: any): void;
    /**
     *
     * @param {String} serviceName
     * @returns {any}
     */
    get(serviceName: string): any;
    injectionArgs(fn: any, locals: any, serviceName: any): any[];
    invoke(fn: any, self: any, locals: any, serviceName: any): any;
    instantiate(Type: any, locals: any, serviceName: any): any;
    /**
     *
     * @param {String} name
     * @returns {boolean}
     */
    has(name: string): boolean;
}
export class InjectorService extends ProviderInjector {
    constructor(cache: any, strictDi: any, providerInjector: any);
    strictDi: any;
    providerInjector: any;
    factory(serviceName: any, caller: any): any;
    loadNewModules(): void;
}
