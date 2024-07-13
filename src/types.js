/**
 * @typedef {Object} angular.InjectorService
 * @property {function(Function, boolean=): string[]} annotate Annotate a function or an array of inline annotations.
 * @property {function(any[]): string[]} annotate Annotate an inline annotated function.
 * @property {function(string, string=): T} get Get a service by name.
 * @property {function(new (...args: any[]): T, any=): T} instantiate Instantiate a type constructor with optional locals.
 * @property {function(Injectable<Function | ((...args: any[]) => T)>, any=, any=): T} invoke Invoke a function with optional context and locals.
 * @property {function(Array<IModule | string | Injectable<(...args: any[]) => void>>): void} loadNewModules Add and load new modules to the injector.
 * @property {Object.<string, IModule>} modules A map of all the modules loaded into the injector.
 * @property {boolean} strictDi Indicates if strict dependency injection is enforced.
 */

export {};
