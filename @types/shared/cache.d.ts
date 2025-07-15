/**
 * Expando cache for adding properties to DOM nodes with JavaScript.
 * This used to be an Object in JQLite decorator, but swapped out for a Map
 *
 * @type {Map<number, import('../interface.ts').ExpandoStore>}
 */
export const Cache: Map<number, import("../interface.ts").ExpandoStore>;
