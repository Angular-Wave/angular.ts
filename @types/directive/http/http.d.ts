/**
 * @typedef {"click" | "change" | "submit"} EventType
 */
/**
 * Selects DOM event to listen for based on the element type.
 *
 * @param {Element} element - The DOM element to inspect.
 * @returns {EventType} The name of the event to listen for.
 */
export function getEventNameForElement(element: Element): EventType;
/**
 * Handles DOM manipulation based on a swap strategy and server-rendered HTML.
 *
 * @param {string} html - The HTML string returned from the server.
 * @param {import("./interface.ts").SwapModeType} swap
 * @param {Element} target - The target DOM element to apply the swap to.
 * @param {ng.Scope} scope
 * @param {ng.CompileService} $compile
 */
export function handleSwapResponse(
  html: string,
  swap: import("./interface.ts").SwapModeType,
  target: Element,
  scope: ng.Scope,
  $compile: ng.CompileService,
): void;
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
export type EventType = "click" | "change" | "submit";
