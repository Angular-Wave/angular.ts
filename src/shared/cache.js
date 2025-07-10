/**
 * Expando cache for adding properties to DOM nodes with JavaScript.
 * This used to be an Object in JQLite decorator, but swapped out for a Map
 * for performance reasons and convenience methods. A proxy is available for
 * additional logic handling.
 *
 * @type {Map<number, import('../interface.ts').ExpandoStore>}
 */
export const Cache = new Map();
