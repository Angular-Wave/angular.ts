/**
 *
 * @param {import("../../core/parse/interface.ts").ParseService} $parse
 * @param {import('../../core/exception-handler.js').ErrorHandler} $exceptionHandler
 * @param {string} directiveName
 * @param {string} eventName
 * @returns {import("../../interface.ts").Directive}
 */
export function createEventDirective(
  $parse: import("../../core/parse/interface.ts").ParseService,
  $exceptionHandler: import("../../core/exception-handler.js").ErrorHandler,
  directiveName: string,
  eventName: string,
): import("../../interface.ts").Directive;
export const ngEventDirectives: {};
