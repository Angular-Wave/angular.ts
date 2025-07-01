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
 * @returns {import("../core/cache/cache.js").ExpandoStore}
 */
export function getExpando(
  element: Element,
  createIfNecessary?: boolean,
): import("../core/cache/cache.js").ExpandoStore;
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
 * @param {string} html
 * @returns {NodeListOf<ChildNode> | HTMLElement[]}
 */
export function parseHtml(html: string): NodeListOf<ChildNode> | HTMLElement[];
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
export function getOrSetCacheData(
  element: Element,
  key: string | any,
  value?: any,
): any;
/**
 * Sets cache data for a given element.
 *
 * @param {Element|Node} element - The DOM element to get or set data on.
 * @param {string} key - The key (as a string) to get/set or an object for mass-setting.
 * @param {*} [value] - The value to set. If not provided, the function acts as a getter.
 * @returns
 */
export function setCacheData(
  element: Element | Node,
  key: string,
  value?: any,
): void;
/**
 * Gets cache data for a given element.
 *
 * @param {Element} element - The DOM element to get data from.
 * @param {string} [key] - The key (as a string) to retrieve. If not provided, returns all data.
 * @returns {*} - The retrieved data for the given key or all data if no key is provided.
 */
export function getCacheData(element: Element, key?: string): any;
/**
 * Deletes cache data for a given element for a particular key.
 *
 * @param {Element} element - The DOM element to delete data from.
 * @param {string} key - The key (as a string) to delete.
 * @returns void
 */
export function deleteCacheData(element: Element, key: string): void;
/**
 * Gets scope for a given element.
 *
 * @param {Element} element - The DOM element to get data from.
 * @returns {*} - The retrieved data for the given key or all data if no key is provided.
 */
export function getScope(element: Element): any;
/**
 * Set scope for a given element.
 *
 * @param {Element|Node|ChildNode} element - The DOM element to set data on.
 * @param {import("../core/scope/scope.js").Scope} scope - The Scope attached to this element
 */
export function setScope(
  element: Element | Node | ChildNode,
  scope: import("../core/scope/scope.js").Scope,
): void;
/**
 * Gets isolate scope for a given element.
 *
 * @param {Element} element - The DOM element to get data from.
 * @returns {*} - The retrieved data for the given key or all data if no key is provided.
 */
export function getIsolateScope(element: Element): any;
/**
 * Set isolate scope for a given element.
 *
 * @param {Element} element - The DOM element to set data on.
 * @param {import("../core/scope/scope.js").Scope} scope - The Scope attached to this element
 */
export function setIsolateScope(
  element: Element,
  scope: import("../core/scope/scope.js").Scope,
): void;
/**
 * Gets the controller instance for a given element, if exists. Defaults to "ngControllerController"
 *
 * @param {Element} element - The DOM element to get data from.
 * @param {string} [name] - The DOM element to get data from.
 * @returns {import("../core/scope/scope.js").Scope|undefined} - The retrieved data
 */
export function getController(
  element: Element,
  name?: string,
): import("../core/scope/scope.js").Scope | undefined;
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
export function setInheritedData(
  element: Node,
  name: string | string[],
  value?: any,
): any;
/**
 *
 * @param {Element} element
 * @param {boolean} keepData
 */
export function removeElement(element: Element, keepData?: boolean): void;
/**
 * Extracts the starting tag from an HTML string or DOM element.
 *
 * @param {string|Element|Node} elementOrStr - The HTML string or DOM element to process.
 * @returns {string} The starting tag or processed result.
 */
export function startingTag(elementOrStr: string | Element | Node): string;
/**
 * Return the DOM siblings between the first and last node in the given array.
 * @param {Array<Node>} nodes An array-like object
 * @returns {Element} the inputted object or a JQLite collection containing the nodes
 */
export function getBlockNodes(nodes: Array<Node>): Element;
/**
 * Gets the name of a boolean attribute if it exists on a given element.
 *
 * @param {Element} element - The DOM element to check.
 * @param {string} name - The name of the attribute.
 * @returns {string|false} - The attribute name if valid, otherwise false.
 */
export function getBooleanAttrName(
  element: Element,
  name: string,
): string | false;
/**
 * Takes an array of elements, calls any `$destroy` event handlers, removes any data in cache, and finally removes any
 * listeners.
 * @param {NodeListOf<Element>|Element[]} nodes
 */
export function cleanElementData(nodes: NodeListOf<Element> | Element[]): void;
/**
 * Return instance of InjectorService attached to element
 * @param {Element} element
 * @returns {import('../core/di/internal-injector.js').InjectorService}
 */
export function getInjector(
  element: Element,
): import("../core/di/internal-injector.js").InjectorService;
/**
 * Creates a DOM element from an HTML string.
 * @param {string} htmlString - A string representing the HTML to parse. Must have only one root element.
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
export function appendNodesToElement(
  element: Element,
  nodes: Node | Node[] | string,
): void;
/**
 * Remove element from the DOM and clear Cache data, associated with the node.
 * @param {Element} element
 */
export function emptyElement(element: Element): void;
/**
 * Checks if the element is root
 * @param {Element} element
 * @returns {boolean}
 */
export function isRoot(element: Element): boolean;
export function domInsert(
  element: any,
  parentElement: any,
  afterElement: any,
): void;
/**
 * Selects DOM event to listen for based on the element type.
 *
 * @param {Element} element - The DOM element to inspect.
 * @returns {"click" | "change" | "submit"} The name of the event to listen for.
 */
export function getEventNameForElement(
  element: Element,
): "click" | "change" | "submit";
/**
 * Handles DOM manipulation based on a swap strategy and server-rendered HTML.
 *
 * @param {string} html - The HTML string returned from the server.
 * @param {string} swap - The swap mode (e.g., "innerHTML", "textContent", "beforebegin").
 * @param {Element} target - The target DOM element to apply the swap to.
 * @param {import('../core/scope/scope.js').Scope} scope
 * @param {import('../core/compile/compile.js').CompileFn} $compile
 */
export function handleSwapResponse(
  html: string,
  swap: string,
  target: Element,
  scope: import("../core/scope/scope.js").Scope,
  $compile: import("../core/compile/compile.js").CompileFn,
): void;
/**
 * A list of boolean attributes in HTML.
 * @type {string[]}
 */
export const BOOLEAN_ATTR: string[];
