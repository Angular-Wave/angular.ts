/**
 *
 * @param {import("../../core/parse/interface.ts").ParseService} $parse
 * @param {import('../../services/exception/exception-handler.js').ErrorHandler} $exceptionHandler
 * @param {string} directiveName
 * @param {string} eventName
 * @returns {import("../../interface.ts").Directive}
 */
export function createEventDirective(
  $parse: import("../../core/parse/interface.ts").ParseService,
  $exceptionHandler: import("../../services/exception/exception-handler.js").ErrorHandler,
  directiveName: string,
  eventName: string,
): import("../../interface.ts").Directive;
/**
 * @type {Record<string, import("../../interface.js").DirectiveFactory>}
 */
export const ngEventDirectives: Record<
  string,
  import("../../interface.js").DirectiveFactory
>;
