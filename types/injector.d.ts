/**
 *
 * @param {*} modulesToLoad
 * @param {*} strictDi
 * @returns {import("./types").InjectorService}
 */
export function createInjector(modulesToLoad: any, strictDi: any): import("./types").InjectorService;
export namespace createInjector {
    export { annotate as $$annotate };
}
declare function annotate(fn: any, strictDi: any, name: any): any;
export {};
