/**
 * Predicate which checks if a value is injectable
 *
 * A value is "injectable" if it is a function, or if it is an ng1 array-notation-style array
 * where all the elements in the array are Strings, except the last one, which is a Function
 * @param {*} val
 * @returns {boolean}
 */
export function isInjectable(val: any): boolean;
/**
 * Predicate which checks if a value looks like a Promise
 *
 * It is probably a Promise if it's an object, and it has a `then` property which is a Function
 * @param {any} obj
 * @returns {boolean}
 */
export function isPromise(obj: any): boolean;
