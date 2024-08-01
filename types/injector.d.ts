/**
 *
 * @param {Array<string|any>} modulesToLoad
 * @param {boolean} strictDi
 * @returns {import("./types").InjectorService}
 */
export function createInjector(modulesToLoad: Array<string | any>, strictDi: boolean): import("./types").InjectorService;
export namespace createInjector {
    export { annotate as $$annotate };
}
declare function annotate(fn: any, strictDi: any, name: any): any;
export {};
