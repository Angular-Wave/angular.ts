export class Injector {
    constructor(modulesToLoad: any, strictDi: any);
    strictDi: boolean;
    path: any[];
    loadedModules: Map<any, any>;
    providerCache: {
        $provide: {
            provider: (key: any, value: any) => any;
            factory: (key: any, value: any) => any;
            service: (key: any, value: any) => any;
            value: (key: any, value: any) => any;
            constant: (key: any, value: any) => any;
            decorator: any;
        };
    };
    providerInjector: InternalInjector;
    instanceCache: {};
    protoInstanceInjector: InternalInjector;
    instanceInjector: any;
    get providerSuffix(): string;
    supportObject(delegate: any): (key: any, value: any) => any;
    provider(name: any, provider_: any): any;
    enforceReturnValue(name: any, factory: any): () => any;
    factory(name: any, factoryFn: any, enforce: any): any;
    service(name: any, constructor: any): any;
    value(name: any, val: any): any;
    constant(name: any, value: any): void;
    decorator(serviceName: any, decorFn: any): void;
    loadModules(modulesToLoad: any): any[];
    annotate(fn: any, strictDi: any, name: any): any;
    stringifyFn(fn: any): any;
    extractArgs(fn: any): any;
    anonFn(fn: any): string;
}
import { InternalInjector } from "./internal-injector";
