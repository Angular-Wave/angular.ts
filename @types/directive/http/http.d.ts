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
 * @param {import("../../interface.ts").SwapInsertPosition} swap
 * @param {Element} target - The target DOM element to apply the swap to.
 * @param {import('../../core/scope/scope.js').Scope} scope
 * @param {import('../../core/compile/compile.js').CompileFn} $compile
 */
export function handleSwapResponse(
  html: string,
  swap: import("../../interface.ts").SwapInsertPosition,
  target: Element,
  scope: import("../../core/scope/scope.js").Scope,
  $compile: import("../../core/compile/compile.js").CompileFn,
): void;
/**
 * Creates an HTTP directive factory that supports GET, DELETE, POST, PUT.
 *
 * @param {"get" | "delete" | "post" | "put"} method - HTTP method to use.
 * @param {string} attrName - Attribute name containing the URL.
 * @returns {import('../../interface.ts').DirectiveFactory}
 */
export function createHttpDirective(
  method: "get" | "delete" | "post" | "put",
  attrName: string,
): import("../../interface.ts").DirectiveFactory;
/** @type {import('../../interface.ts').DirectiveFactory} */
export const ngGetDirective: import("../../interface.ts").DirectiveFactory;
/** @type {import('../../interface.ts').DirectiveFactory} */
export const ngDeleteDirective: import("../../interface.ts").DirectiveFactory;
/** @type {import('../../interface.ts').DirectiveFactory} */
export const ngPostDirective: import("../../interface.ts").DirectiveFactory;
/** @type {import('../../interface.ts').DirectiveFactory} */
export const ngPutDirective: import("../../interface.ts").DirectiveFactory;
export type EventType = "click" | "change" | "submit";
