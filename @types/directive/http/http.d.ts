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
 * Creates an HTTP directive factory that supports GET, DELETE, POST, PUT.
 *
 * @param {"get" | "delete" | "post" | "put"} method - HTTP method to use.
 * @param {string} attrName - Attribute name containing the URL.
 * @returns {ng.DirectiveFactory}
 */
export function createHttpDirective(
  method: "get" | "delete" | "post" | "put",
  attrName: string,
): ng.DirectiveFactory;
/** @type {ng.DirectiveFactory} */
export const ngGetDirective: ng.DirectiveFactory;
/** @type {ng.DirectiveFactory} */
export const ngDeleteDirective: ng.DirectiveFactory;
/** @type {ng.DirectiveFactory} */
export const ngPostDirective: ng.DirectiveFactory;
/** @type {ng.DirectiveFactory} */
export const ngPutDirective: ng.DirectiveFactory;
/** @type {ng.DirectiveFactory} */
export const ngSseDirective: ng.DirectiveFactory;
