/**
 * A filter function takes an input and optional arguments, and returns a transformed value.
 */
export type FilterFn = (input: any, ...args: any[]) => any;

/**
 * A filter factory function that returns a FilterFn.
 */
export type FilterFactory = (...args: any[]) => FilterFn;
