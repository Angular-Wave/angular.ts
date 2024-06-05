/**
 * Predicates
 *
 * These predicates return true/false based on the input.
 * Although these functions are exported, they are subject to change without notice.
 *
 * @packageDocumentation
 */
import { and, not, pipe, prop, or } from "../router/common/hof";
import { isFunction, isObject, isString, isUndefined } from "./utils";
export const isNull = (o) => o === null;
export const isNullOrUndefined = or(isNull, isUndefined);
/**
 * Predicate which checks if a value is injectable
 *
 * A value is "injectable" if it is a function, or if it is an ng1 array-notation-style array
 * where all the elements in the array are Strings, except the last one, which is a Function
 */
export function isInjectable(val) {
  if (Array.isArray(val) && val.length) {
    const head = val.slice(0, -1),
      tail = val.slice(-1);
    return !(
      head.filter(not(isString)).length || tail.filter(not(isFunction)).length
    );
  }
  return isFunction(val);
}
/**
 * Predicate which checks if a value looks like a Promise
 *
 * It is probably a Promise if it's an object, and it has a `then` property which is a Function
 */
export const isPromise = and(isObject, pipe(prop("then"), isFunction));
