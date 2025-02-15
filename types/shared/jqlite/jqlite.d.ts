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
 * Removes expando data from this element. If key is provided, only
 * its field is removed. If data is empty, also removes `ExpandoStore`
 * from cache.
 * @param {Element} element
 * @param {string} [name] - key of field to remove
 */
export function removeElementData(element: Element, name?: string): void;
/**
 * Stores data associated with an element inside the expando property of the DOM element.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Expando MDN Glossary: Expando}
 *
 * @param {Element} element
 * @param {boolean} [createIfNecessary=false]
 * @returns {import("../../core/cache/cache.js").ExpandoStore}
 */
export function getExpando(element: Element, createIfNecessary?: boolean): import("../../core/cache/cache.js").ExpandoStore;
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
 * @param {Element} element
 * @param {boolean} [onlyDescendants]
 * @returns {void}
 */
export function dealoc(element: Element, onlyDescendants?: boolean): void;
/**
 * Gets or sets cache data for a given element.
 *
 * @param {Element} element - The DOM element to get or set data on.
 * @param {string|Object} key - The key (as a string) to get/set or an object for mass-setting.
 * @param {*} [value] - The value to set. If not provided, the function acts as a getter.
 * @returns {*} - The retrieved data if acting as a getter. Otherwise, returns undefined.
 */
export function getOrSetCacheData(element: Element, key: string | any, value?: any): any;
/**
 * Sets cache data for a given element.
 *
 * @param {Element} element - The DOM element to get or set data on.
 * @param {string} key - The key (as a string) to get/set or an object for mass-setting.
 * @param {*} [value] - The value to set. If not provided, the function acts as a getter.
 * @returns
 */
export function setCacheData(element: Element, key: string, value?: any): void;
/**
 * Gets cache data for a given element.
 *
 * @param {Element} element - The DOM element to get data from.
 * @param {string} [key] - The key (as a string) to retrieve. If not provided, returns all data.
 * @returns {*} - The retrieved data for the given key or all data if no key is provided.
 */
export function getCacheData(element: Element, key?: string): any;
/**
 * @param {Node} element
 * @param {string} [name]
 * @returns
 */
export function getController(element: Node, name?: string): any;
/**
 *
 * @param {Node} element
 * @param {string} name
 * @returns
 */
export function getInheritedData(element: Node, name: string): any;
/**
 *
 * @param {Node} element
 * @param {string|string[]} name
 * @param {any} [value]
 * @returns
 */
export function setInheritedData(element: Node, name: string | string[], value?: any): any;
/**
 *
 * @param {Element} element
 * @param {boolean} keepData
 */
export function removeElement(element: Element, keepData?: boolean): void;
/**
 * Extracts the starting tag from an HTML string or DOM element.
 *
 * @param {string|Element} elementOrStr - The HTML string or DOM element to process.
 * @returns {string} The starting tag or processed result.
 */
export function startingTag(elementOrStr: string | Element): string;
/**
 * Return the DOM siblings between the first and last node in the given array.
 * @param {JQLite|Array} nodes An array-like object
 * @returns {JQLite} the inputted object or a JQLite collection containing the nodes
 */
export function getBlockNodes(nodes: JQLite | any[]): JQLite;
export function getBooleanAttrName(element: any, name: any): any;
/**
 * Takes an array of elements, calls any `$destroy` event handlers, removes any data in cache, and finally removes any
 * listeners.
 * @param {NodeListOf<Element>|Element[]} nodes
 */
export function cleanElementData(nodes: NodeListOf<Element> | Element[]): void;
/**
 * Return instance of injector attached to element
 * @returns {import('../../core/di/internal-injector.js').InjectorService}
 */
export function getInjector(element: any): import("../../core/di/internal-injector.js").InjectorService;
export function setData(element: any, key: any, value: any): void;
/**
 * Creates a DOM element from an HTML string.
 * @param {string} htmlString - A string representing the HTML to parse.
 * @returns {Element} - The parsed DOM element.
 */
export function createElementFromHTML(htmlString: string): Element;
/**
 * Creates a DOM element from an HTML string.
 * @param {string} htmlString - A string representing the HTML to parse.
 * @returns {NodeList} - The parsed DOM element.
 */
export function createNodelistFromHTML(htmlString: string): NodeList;
/**
 * Appends nodes or an HTML string to a given DOM element.
 * @param {Element} element - The element to append nodes to.
 * @param {Node | Node[] | string} nodes - Nodes or HTML string to append.
 */
export function appendNodesToElement(element: Element, nodes: Node | Node[] | string): void;
/**
 * Remove element from the DOM and clear CACHE data, associated with the node.
 * @param {Element} element
 */
export function emptyElement(element: Element): void;
export function domInsert(element: any, parentElement: any, afterElement: any): void;
export const BOOLEAN_ATTR: {};
