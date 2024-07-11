/**
 * Converts kebab-case to camelCase.
 * @param {string} name Name to normalize
 * @returns {string}
 */
export function kebabToCamel(name: string): string;
/**
 * Converts sname to camelCase.
 * @param {string} name
 * @returns {string}
 */
export function snakeToCamel(name: string): string;
/**
 * Checks if the string contains HTML tags or entities.
 * @param {string} html
 * @returns {boolean}
 */
export function isTextNode(html: string): boolean;
export function jqLiteBuildFragment(html: any, context: any): any;
export function JQLite(element: any): any;
export class JQLite {
  constructor(element: any);
  ready: typeof jqLiteReady;
  toString(): string;
  eq(index: any): any;
  length: number;
  push: (...items: undefined[]) => number;
  sort: (compareFn?: (a: undefined, b: undefined) => number) => undefined[];
  splice: {
    (start: number, deleteCount?: number): undefined[];
    (start: number, deleteCount: number, ...items: undefined[]): undefined[];
  };
}
/**
 * @param {Element} element
 * @param {boolean} [onlyDescendants]
 * @returns {void}
 */
export function dealoc(element: Element, onlyDescendants?: boolean): void;
export function jqLiteRemove(element: any, keepData: any): void;
export function getBooleanAttrName(element: any, name: any): any;
export function jqLiteCleanData(nodes: any): void;
/**
 * @param {string} elementStr
 * @returns {string} Returns the string representation of the element.
 */
export function startingTag(elementStr: string): string;
/**
 * Return the DOM siblings between the first and last node in the given array.
 * @param {Array} nodes An array-like object
 * @returns {Array} the inputted object or a jqLite collection containing the nodes
 */
export function getBlockNodes(nodes: any[]): any[];
export const jqLite: typeof JQLite;
export const BOOLEAN_ATTR: {};
declare function jqLiteReady(fn: any): void;
export {};
