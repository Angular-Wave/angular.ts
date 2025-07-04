/**
 * @typedef {Object} ExpandoStore
 * @property {!Object<string, any>} data
 *
 */
export const EXPANDO: "ng";
/**
 * Expando cache for adding properties to DOM nodes with JavaScript.
 * This used to be an Object in JQLite decorator, but swapped out for a Map
 * for performance reasons and convenience methods. A proxy is available for
 * additional logic handling.
 *
 * @type {Map<number, ExpandoStore>}
 */
export const Cache: Map<number, ExpandoStore>;
/**
 * Key for storing scope data, attached to an element
 */
export const SCOPE_KEY: "$scope";
/**
 * Key for storing isolate scope data, attached to an element
 */
export const ISOLATE_SCOPE_KEY: "$isolateScope";
export type ExpandoStore = {
  data: {
    [x: string]: any;
  };
};
