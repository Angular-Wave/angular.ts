export function createInjector(modulesToLoad: any, strictDi: any): {
    invoke: (fn: any, self: any, locals: any, serviceName: any) => any;
    instantiate: (Type: any, locals: any, serviceName: any) => any;
    get: (serviceName: any, caller: any) => any;
    annotate: typeof annotate;
    has: (name: any) => any;
};
export namespace createInjector {
    export { annotate as $$annotate };
}
declare function annotate(fn: any, strictDi: any, name: any): any;
export {};
