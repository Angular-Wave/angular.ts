/**
 *
 * @param {Array<String|Function>} modulesToLoad
 * @param {boolean} [strictDi]
 * @returns {import("../../types").InjectorService}
 */
export function createInjector(modulesToLoad: Array<string | Function>, strictDi?: boolean): import("../../types").InjectorService;
export namespace createInjector {
    export { annotate as $$annotate };
}
declare function annotate(fn: any, strictDi: any, name: any): any;
export {};
