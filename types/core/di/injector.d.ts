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
/**
 *
 * @param {import('../../types').AnnotatedFunction} fn
 * @param {boolean} strictDi
 * @param {String} name
 * @returns {Array<string>}
 */
declare function annotate(fn: import("../../types").AnnotatedFunction, strictDi: boolean, name: string): Array<string>;
export {};
