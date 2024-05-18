/**
 * @typedef {Object} ExpandoStore
 *
 * @property {!Object<string, any>} data
 * @property {!Object} events
 * @property {?Function} handle
 *
 */

/**
 * Expando cache for adding properties to DOM nodes with JavaScript.
 * This used to be an Object in JQLite decorator, but swapped out for a Map
 * for performance reasons and convenience methods. A proxy is available for
 * additional logic handling.
 *
 * @type {Map<number, ExpandoStore>}
 */
export const CACHE = new Proxy(new Map(), {
  get(target, prop, receiver) {
    if (prop === "size") {
      return target.size;
    }
    if (typeof target[prop] === "function") {
      return function (...args) {
        return target[prop].apply(target, args);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    return Reflect.set(target, prop, value, receiver);
  },
  deleteProperty(target, prop) {
    return Reflect.deleteProperty(target, prop);
  },
  has(target, prop) {
    return Reflect.has(target, prop);
  },
  ownKeys(target) {
    return Reflect.ownKeys(target);
  },
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(target, prop);
  },
});
