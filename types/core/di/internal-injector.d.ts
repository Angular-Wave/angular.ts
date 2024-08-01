export class InternalInjector {
    constructor(cache: any, factory: any, strictDi: any, annotateFn: any, path: any);
    cache: any;
    factory: any;
    strictDi: any;
    annotateFn: any;
    path: any;
    INSTANTIATING: {};
    get(serviceName: any, caller: any): any;
    injectionArgs(fn: any, locals: any, serviceName: any): any[];
    isClass(func: any): any;
    invoke(fn: any, self: any, locals: any, serviceName: any): any;
    instantiate(Type: any, locals: any, serviceName: any): any;
    has(name: any): any;
    stringifyFn(fn: any): any;
}
