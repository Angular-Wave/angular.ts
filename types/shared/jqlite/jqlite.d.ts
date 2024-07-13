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
 * @returns {boolean} True if the string is plain text, false if it contains HTML tags or entities.
 */
export function isTextNode(html: string): boolean;
/**
 * @param {string} html
 * @returns {DocumentFragment}
 */
export function buildFragment(html: string): DocumentFragment;
/**
 * @param {string|Element|Document|Window|JQLite|ArrayLike<Element>|(() => void)} element
 * @returns {JQLite}
 */
export function JQLite(element: string | Element | Document | Window | JQLite | ArrayLike<Element> | (() => void)): JQLite;
export class JQLite {
    /**
     * @param {string|Element|Document|Window|JQLite|ArrayLike<Element>|(() => void)} element
     * @returns {JQLite}
     */
    constructor(element: string | Element | Document | Window | JQLite | ArrayLike<Element> | (() => void));
    /**
     * Remove all child nodes of the set of matched elements from the DOM and clears CACHE data, associated with the node.
     * @returns {JQLite} The current instance of JQLite.
     */
    empty(): JQLite;
    toString(): string;
    eq(index: any): JQLite;
    length: number;
}
/**
 * @param {Element} element
 * @param {boolean} [onlyDescendants]
 * @returns {void}
 */
export function dealoc(element: Element, onlyDescendants?: boolean): void;
/**
 * Removes expando data from this element. If key is provided, only
 * its field is removed. If data is empty, also removes `ExpandoStore`
 * from cache.
 * @param {Element} element
 * @param {string} [name] - key of field to remove
 */
export function removeElementData(element: Element, name?: string): void;
/**
 *
 * @param {Element} element
 * @param {boolean} keepData
 */
export function removeElement(element: Element, keepData?: boolean): void;
export function getBooleanAttrName(element: any, name: any): any;
export function JQLiteCleanData(nodes: any): void;
/**
 * @param {string} elementStr
 * @returns {string} Returns the string representation of the element.
 */
export function startingTag(elementStr: string): string;
/**
 * Return the DOM siblings between the first and last node in the given array.
 * @param {Array} nodes An array-like object
 * @returns {JQLite} the inputted object or a JQLite collection containing the nodes
 */
export function getBlockNodes(nodes: any[]): JQLite;
export const BOOLEAN_ATTR: {};
